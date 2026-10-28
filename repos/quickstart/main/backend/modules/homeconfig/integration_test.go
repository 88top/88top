package homeconfig

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRootSessionsAreVerifiedNotInferred(t *testing.T) {
	sid := strings.Repeat("a", 32)
	for _, item := range []struct {
		name, headerID, headerToken, user, token string
		err                                      error
		ok                                       bool
	}{
		{"valid", sid, "token", "root", "token", nil, true},
		{"non-root", sid, "token", "guest", "token", nil, false},
		{"bad token", sid, "wrong", "root", "token", nil, false},
		{"expired", sid, "token", "", "", errors.New("not found"), false},
		{"missing", "", "token", "root", "token", nil, false},
		{"injection", sid + "; touch /tmp/bad", "token", "root", "token", nil, false},
	} {
		t.Run(item.name, func(t *testing.T) {
			auth := RootAuthorizer(func(context.Context, string) (Session, error) {
				return Session{Username: item.user, Token: item.token}, item.err
			})
			r := httptest.NewRequest("GET", "/", nil)
			r.Header.Set("X-Forwarded-Sid", item.headerID)
			r.Header.Set("X-Forwarded-Token", item.headerToken)
			got, err := auth(r)
			if (err == nil && got.Read && got.Write) != item.ok {
				t.Fatalf("%+v %v", got, err)
			}
		})
	}
}
func TestOneTimeMigrationPreservesDisabledModulesAndReceipt(t *testing.T) {
	root := t.TempDir()
	store := NewStore(root)
	reads := 0
	repo := NewInitializedStore(store, func() (LegacySettings, error) {
		reads++
		return LegacySettings{Exists: true, Disabled: []string{"networkFlow", "quickActions", "configModule", "docker"}}, nil
	})
	first, err := repo.Read("layout")
	if err != nil {
		t.Fatal(err)
	}
	var layout Layout
	json.Unmarshal(first.Value, &layout)
	for _, row := range layout.Rows {
		for _, column := range row.Columns {
			for _, id := range column.Cards {
				if id != nil && (*id == "traffic" || *id == "applications" || *id == "devices" || *id == "docker") {
					t.Fatal("migration re-enabled hidden/new module", *id)
				}
			}
		}
	}
	if _, err = repo.Read("layout"); err != nil || reads != 1 {
		t.Fatal("migration ran more than once", reads, err)
	}
	if _, err = repo.Save("layout", first.Version, emptyLayout(t)); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join(root, "home-layout.json"))
	if err != nil {
		t.Fatal(err)
	}
	var envelope map[string]json.RawMessage
	json.Unmarshal(raw, &envelope)
	if !strings.Contains(string(envelope["migration"]), "networkFlow") {
		t.Fatal("original display settings lost")
	}
}
func TestLegacyFailureDoesNotCreateDefaults(t *testing.T) {
	root := filepath.Join(t.TempDir(), "uncreated")
	repo := NewInitializedStore(NewStore(root), func() (LegacySettings, error) { return LegacySettings{}, errors.New("read failed") })
	if _, err := repo.Read("layout"); err == nil {
		t.Fatal("failed read mapped to defaults")
	}
	if _, err := os.Stat(root); !os.IsNotExist(err) {
		t.Fatal("failed migration wrote files")
	}
}
func TestLegacyEmptyAllHiddenAndNewInstall(t *testing.T) {
	legacy, err := ParseLegacyExport("package quickstart\nconfig quickstart 'main'\noption path '/disk'\nconfig disabledisplay 'modules'\nlist module 'networkFlow'\n")
	if err != nil || !legacy.Exists || len(legacy.Disabled) != 1 {
		t.Fatal(legacy, err)
	}
	if _, err = ParseLegacyExport("config disabledisplay 'modules'\nlist module 'bad input'"); err == nil {
		t.Fatal("invalid previous setting ignored")
	}
	emptyLegacy, emptyErr := ParseLegacyExport("config disabledisplay 'modules'\nlist module ''")
	if emptyErr != nil || len(emptyLegacy.Disabled) != 1 || emptyLegacy.Disabled[0] != "" {
		t.Fatal("legacy empty sentinel rejected", emptyErr)
	}
	all := LegacySettings{Exists: true, Disabled: []string{"quickActions", "configModule", "networkFlow", "networkConnection", "networkInterface", "diskInfo", "storage", "docker", "downloadService", "remoteDomain", "systemInfo"}}
	raw, err := InitialValue("layout", all)
	if err != nil {
		t.Fatal(err)
	}
	var layout Layout
	json.Unmarshal(raw, &layout)
	if len(layout.Rows) != 0 {
		t.Fatal("hidden all not preserved")
	}
	raw, err = InitialValue("layout", LegacySettings{})
	if err != nil {
		t.Fatal(err)
	}
	json.Unmarshal(raw, &layout)
	if len(layout.Rows) != 5 {
		t.Fatal("new install missing approved default")
	}
}
func TestInitializedHTTPRoundTripWithRealAuthorizationLogic(t *testing.T) {
	repo := NewInitializedStore(NewStore(t.TempDir()), func() (LegacySettings, error) { return LegacySettings{Disabled: []string{}}, nil })
	authorize := RootAuthorizer(func(context.Context, string) (Session, error) { return Session{Username: "root", Token: "token"}, nil })
	h := Handler(repo, "launcher", authorize)
	request := func(method, body string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, "http://router/config", strings.NewReader(body))
		r.Header.Set("X-Forwarded-Sid", strings.Repeat("a", 32))
		r.Header.Set("X-Forwarded-Token", "token")
		r.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		return w
	}
	var first struct {
		Result Snapshot `json:"result"`
	}
	w := request(http.MethodGet, "")
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	json.Unmarshal(w.Body.Bytes(), &first)
	body, _ := json.Marshal(saveRequest{ExpectedVersion: first.Result.Version, Value: launcher()})
	if w = request("POST", string(body)); w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	if w = request("POST", string(body)); w.Code != 409 {
		t.Fatal("stale version accepted")
	}
	var final struct {
		Result Snapshot `json:"result"`
	}
	json.Unmarshal(request("GET", "").Body.Bytes(), &final)
	var saved Launcher
	json.Unmarshal(final.Result.Value, &saved)
	if len(saved.Favorites) != 0 {
		t.Fatal("empty launcher reset to defaults")
	}
}
