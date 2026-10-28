package config

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"github.com/istoreos/quickstart/backend/models"
)

type fakeStore struct {
	ensureErr error
	runErr    error
	outputErr error
	output    string

	ensures int
	runs    [][]string
	outputs [][]string
}

func (store *fakeStore) EnsureConfig(ctx context.Context) error {
	store.ensures++
	return store.ensureErr
}

func (store *fakeStore) Run(ctx context.Context, commands []string) error {
	store.runs = append(store.runs, append([]string(nil), commands...))
	return store.runErr
}

func (store *fakeStore) Output(ctx context.Context, commands []string) (string, error) {
	store.outputs = append(store.outputs, append([]string(nil), commands...))
	return store.output, store.outputErr
}

func TestServiceSetBuildsLegacyOptionAndListCommands(t *testing.T) {
	store := &fakeStore{}
	service := NewService(store)

	resp, err := service.Set(context.Background(), models.QuickstartConfigRequest{
		Key:    "dockerdir",
		Type:   "option",
		Values: []string{"/mnt/a", "/mnt/b"},
	})
	if err != nil {
		t.Fatalf("set option: %v", err)
	}
	if resp.Success == nil || *resp.Success != 0 {
		t.Fatalf("expected success 0, got %#v", resp.Success)
	}
	requireCommands(t, store.runs[0], []string{
		"uci set quickstart.main.dockerdir=/mnt/a",
		"uci set quickstart.main.dockerdir=/mnt/b",
		"uci commit quickstart",
	})

	store.runs = nil
	_, err = service.Set(context.Background(), models.QuickstartConfigRequest{
		Key:    "plugins",
		Type:   "list",
		Values: []string{"a", "b"},
	})
	if err != nil {
		t.Fatalf("set list: %v", err)
	}
	requireCommands(t, store.runs[0], []string{
		"uci add_list quickstart.main.plugins=a",
		"uci add_list quickstart.main.plugins=b",
		"uci commit quickstart",
	})
	if store.ensures != 2 {
		t.Fatalf("expected ensure before each set, got %d", store.ensures)
	}
}

func TestServiceSetPreservesLegacyErrors(t *testing.T) {
	service := NewService(&fakeStore{ensureErr: errors.New("无法访问/etc/config/quickstart")})
	if _, err := service.Set(context.Background(), models.QuickstartConfigRequest{}); err == nil || err.Error() != "无法访问/etc/config/quickstart" {
		t.Fatalf("expected config access error, got %v", err)
	}

	service = NewService(&fakeStore{runErr: errors.New("run failed")})
	if _, err := service.Set(context.Background(), models.QuickstartConfigRequest{Key: "dockerdir"}); err == nil || err.Error() != "设置失败" {
		t.Fatalf("expected set failure, got %v", err)
	}
}

func TestServiceGetParsesLegacyOptionAndListOutput(t *testing.T) {
	store := &fakeStore{output: "quickstart.main.dockerdir='/mnt/data'\n"}
	service := NewService(store)

	resp, err := service.Get(context.Background(), models.QuickstartGetConfigRequest{Key: "dockerdir"})
	if err != nil {
		t.Fatalf("get option: %v", err)
	}
	requireQuickstartConfig(t, resp.Result, &models.QuickstartConfigResponseResult{
		Key:    "dockerdir",
		Type:   "option",
		Values: []string{"/mnt/data"},
	})
	requireCommands(t, store.outputs[0], []string{"uci show quickstart.main.dockerdir"})

	store.output = "quickstart.main.plugins='a'\nquickstart.main.plugins='b'\n"
	resp, err = service.Get(context.Background(), models.QuickstartGetConfigRequest{Key: "plugins"})
	if err != nil {
		t.Fatalf("get list: %v", err)
	}
	requireQuickstartConfig(t, resp.Result, &models.QuickstartConfigResponseResult{
		Key:    "plugins",
		Type:   "list",
		Values: []string{"a", "b"},
	})
	if store.ensures != 0 {
		t.Fatalf("get should not check config path to preserve legacy behavior, got %d", store.ensures)
	}
}

func TestServiceGetPreservesLegacyErrors(t *testing.T) {
	service := NewService(&fakeStore{outputErr: errors.New("uci failed")})
	if _, err := service.Get(context.Background(), models.QuickstartGetConfigRequest{Key: "missing"}); err == nil || err.Error() != "获取信息失败" {
		t.Fatalf("expected get failure, got %v", err)
	}

	service = NewService(&fakeStore{output: "quickstart.main.missing=\n"})
	if _, err := service.Get(context.Background(), models.QuickstartGetConfigRequest{Key: "missing"}); err == nil || err.Error() != "没有对应的值" {
		t.Fatalf("expected missing value failure, got %v", err)
	}
}

func TestServiceDeleteBuildsLegacyCommands(t *testing.T) {
	store := &fakeStore{}
	service := NewService(store)

	resp, err := service.Delete(context.Background(), models.QuickstartDeleteConfigRequest{Key: "dockerdir"})
	if err != nil {
		t.Fatalf("delete: %v", err)
	}
	if resp.Success == nil || *resp.Success != 0 {
		t.Fatalf("expected success 0, got %#v", resp.Success)
	}
	requireCommands(t, store.runs[0], []string{
		"uci delete quickstart.main.dockerdir",
		"uci commit quickstart",
	})
	if store.ensures != 0 {
		t.Fatalf("delete should not check config path to preserve legacy behavior, got %d", store.ensures)
	}
}

func TestServiceGlobalFoldersMapsLegacyUCIKeys(t *testing.T) {
	store := &fakeStore{output: "" +
		"main_dir='/mnt/main'\n" +
		"conf_dir='/mnt/configs'\n" +
		"pub_dir='/mnt/public'\n" +
		"dl_dir='/mnt/downloads'\n" +
		"tmp_dir='/mnt/cache'\n" +
		"ignored='/mnt/ignored'\n"}
	service := NewService(store)

	resp, err := service.GetGlobalFolders(context.Background())
	if err != nil {
		t.Fatalf("get global folders: %v", err)
	}
	want := &models.GlobalFolders{
		Home:      "/mnt/main",
		Configs:   "/mnt/configs",
		Public:    "/mnt/public",
		Downloads: "/mnt/downloads",
		Caches:    "/mnt/cache",
	}
	if !reflect.DeepEqual(resp.Result, want) {
		t.Fatalf("unexpected folders\nwant: %#v\n got: %#v", want, resp.Result)
	}
	requireCommands(t, store.outputs[0], []string{"uci show quickstart.main | grep -F 'quickstart.main.' | sed 's/^quickstart\\.main\\.//g'"})
	if store.ensures != 1 {
		t.Fatalf("expected config check before global folders get, got %d", store.ensures)
	}
}

func TestServiceSetGlobalFoldersBuildsQuotedCommands(t *testing.T) {
	store := &fakeStore{}
	service := NewService(store)

	resp, err := service.SetGlobalFolders(context.Background(), models.GlobalFolders{
		Home:      "/mnt/main",
		Configs:   "/mnt/configs",
		Public:    "/mnt/public",
		Downloads: "/mnt/downloads",
		Caches:    "/mnt/cache",
	})
	if err != nil {
		t.Fatalf("set global folders: %v", err)
	}
	if resp.Success == nil || *resp.Success != 0 {
		t.Fatalf("expected success 0, got %#v", resp.Success)
	}
	requireCommands(t, store.runs[0], []string{
		"uci set quickstart.main.main_dir=/mnt/main",
		"uci set quickstart.main.conf_dir=/mnt/configs",
		"uci set quickstart.main.pub_dir=/mnt/public",
		"uci set quickstart.main.dl_dir=/mnt/downloads",
		"uci set quickstart.main.tmp_dir=/mnt/cache",
		"uci commit quickstart",
	})
	if store.ensures != 1 {
		t.Fatalf("expected config check before global folders set, got %d", store.ensures)
	}
}

func requireCommands(t *testing.T, got []string, want []string) {
	t.Helper()

	if !reflect.DeepEqual(got, want) {
		t.Fatalf("unexpected commands\nwant: %#v\n got: %#v", want, got)
	}
}

func TestRejectsInvalidParametersBeforeCommands(t *testing.T) {
	for _, key := range []string{"", "main.value", "../key", "two keys", "key;", "key\n"} {
		store := &fakeStore{}
		svc := NewService(store)
		if _, err := svc.Set(context.Background(), models.QuickstartConfigRequest{Key: key, Values: []string{"data"}}); err == nil {
			t.Errorf("set accepted %q", key)
		}
		if _, err := svc.Get(context.Background(), models.QuickstartGetConfigRequest{Key: key}); err == nil {
			t.Errorf("get accepted %q", key)
		}
		if _, err := svc.Delete(context.Background(), models.QuickstartDeleteConfigRequest{Key: key}); err == nil {
			t.Errorf("delete accepted %q", key)
		}
		if len(store.runs) != 0 || len(store.outputs) != 0 {
			t.Fatal("invalid key reached commands")
		}
	}
	for _, req := range []models.QuickstartConfigRequest{{Key: "valid", Type: "other"}, {Key: "valid", Values: []string{"line\nbreak"}}, {Key: "valid", Values: []string{"nul\x00value"}}} {
		store := &fakeStore{}
		if _, err := NewService(store).Set(context.Background(), req); err == nil || len(store.runs) != 0 {
			t.Fatal("invalid value/type reached commands")
		}
	}
}

func TestGetPreservesQuotedAndEmptyValues(t *testing.T) {
	for _, tc := range []struct {
		raw    string
		values []string
	}{
		{"quickstart.main.paths='/mnt/My Files' '/mnt/O'\\''Brien' '$literal' ''\n", []string{"/mnt/My Files", "/mnt/O'Brien", "$literal", ""}},
		{"quickstart.main.paths=''\n", []string{""}},
		{"quickstart.main.paths='C:\\data'\n", []string{`C:\data`}},
	} {
		result, err := ParseGetOutput("paths", tc.raw)
		if err != nil || !reflect.DeepEqual(result.Values, tc.values) {
			t.Fatalf("parse %q: %#v, %v", tc.raw, result, err)
		}
	}
	result, err := ParseGlobalFoldersOutput("main_dir='/mnt/My Files'\nconf_dir='/mnt/O'\\''Brien'\nplugins='a' 'b'\n")
	if err != nil || result.Home != "/mnt/My Files" || result.Configs != "/mnt/O'Brien" {
		t.Fatalf("folders: %#v, %v", result, err)
	}
}

func TestGlobalFoldersRejectsInvalidPathsBeforeCommands(t *testing.T) {
	for _, path := range []string{"relative", "/mnt/line\nbreak", "/mnt/nul\x00"} {
		store := &fakeStore{}
		if _, err := NewService(store).SetGlobalFolders(context.Background(), models.GlobalFolders{Home: path}); err == nil || len(store.runs) != 0 {
			t.Fatalf("accepted %q", path)
		}
	}
}

func requireQuickstartConfig(t *testing.T, got *models.QuickstartConfigResponseResult, want *models.QuickstartConfigResponseResult) {
	t.Helper()

	if !reflect.DeepEqual(got, want) {
		t.Fatalf("unexpected config\nwant: %#v\n got: %#v", want, got)
	}
}
