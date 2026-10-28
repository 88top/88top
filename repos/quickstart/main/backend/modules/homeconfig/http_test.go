package homeconfig

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestHTTPAuthorizationCannotBeReplacedByHeaders(t *testing.T) {
	root := filepath.Join(t.TempDir(), "config")
	s := NewStore(root)
	for _, authorize := range []Authorize{nil, func(*http.Request) (Access, error) { return Access{}, errors.New("invalid session") }, func(*http.Request) (Access, error) { return Access{Read: true}, nil }} {
		h := Handler(s, "launcher", authorize)
		r := httptest.NewRequest("POST", "http://router/home/", strings.NewReader(`{"expectedVersion":"missing","value":{"schemaVersion":1,"favorites":[],"links":[]}}`))
		r.Header.Set("Content-Type", "application/json")
		r.Header.Set("X-Forwarded-Sid", "not-proof")
		r.Header.Set("X-Forwarded-User", "root")
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		if w.Code != 403 {
			t.Fatal("unauthorized write accepted", w.Code)
		}
		if _, err := os.Stat(root); !os.IsNotExist(err) {
			t.Fatal("denied request touched storage")
		}
	}
}
func TestHTTPReadWriteErrorsAndNoSecretDisclosure(t *testing.T) {
	s := NewStore(t.TempDir())
	h := Handler(s, "launcher", func(*http.Request) (Access, error) { return Access{Read: true, Write: true}, nil })
	request := func(method, body, origin string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, "http://router/home/", strings.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		if origin != "" {
			r.Header.Set("Origin", origin)
		}
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		if w.Header().Get("Cache-Control") != "no-store" {
			t.Fatal("cacheable private config")
		}
		return w
	}
	get := request("GET", "", "")
	if get.Code != 200 || !strings.Contains(get.Body.String(), `"missing"`) {
		t.Fatal(get.Body.String())
	}
	body := `{"expectedVersion":"missing","value":{"schemaVersion":1,"favorites":[],"links":[]}}`
	if w := request("POST", body, "http://attacker"); w.Code != 403 {
		t.Fatal("cross origin accepted")
	}
	if w := request("POST", body, ""); w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	if w := request("POST", body, ""); w.Code != 409 {
		t.Fatal("stale create accepted")
	}
	if w := request("POST", strings.Repeat("x", MaxBytes+1), ""); w.Code != 413 {
		t.Fatal("oversize accepted")
	}
	if w := request("POST", `{"expectedVersion":"secret-in-url","value":{"schemaVersion":1,"favorites":[],"links":[]},"unexpected":"private-token"}`, ""); w.Code != 422 || strings.Contains(w.Body.String(), "private-token") {
		t.Fatal("invalid request disclosure")
	}
	if w := request("DELETE", "", ""); w.Code != 405 {
		t.Fatal("unknown method accepted")
	}
	var current struct {
		Result Snapshot `json:"result"`
	}
	json.Unmarshal(request("GET", "", "").Body.Bytes(), &current)
	s.write = func(string, []byte) error { return errors.New("/private/path/https://nas/?secret=token") }
	bodyRaw, _ := json.Marshal(saveRequest{ExpectedVersion: current.Result.Version, Value: launcher("tool-dns")})
	failed := request("POST", string(bodyRaw), "")
	if failed.Code != 503 || bytes.Contains(failed.Body.Bytes(), []byte("secret")) {
		t.Fatal("storage error disclosed sensitive data")
	}
}
