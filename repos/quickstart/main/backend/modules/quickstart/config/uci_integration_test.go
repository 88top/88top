package config

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"github.com/istoreos/quickstart/backend/models"
)

type isolatedUCIStore struct{}

func (isolatedUCIStore) EnsureConfig(context.Context) error { return nil }
func (isolatedUCIStore) Run(ctx context.Context, commands []string) error {
	return exec.CommandContext(ctx, "bash", "-ec", strings.Join(commands, "\n")).Run()
}
func (isolatedUCIStore) Output(ctx context.Context, commands []string) (string, error) {
	raw, err := exec.CommandContext(ctx, "bash", "-ec", strings.Join(commands, "\n")).Output()
	return string(raw), err
}

// Opt-in device test: all UCI files and deltas live under a fresh temporary
// directory. It never writes /etc/config or reloads any service.
func TestIsolatedRealUCIRoundTrip(t *testing.T) {
	uci := os.Getenv("QUICKSTART_TEST_UCI")
	if uci == "" {
		t.Skip("set QUICKSTART_TEST_UCI to a real UCI executable")
	}
	dir := t.TempDir()
	configDir, deltaDir := filepath.Join(dir, "config"), filepath.Join(dir, "delta")
	for _, p := range []string{configDir, deltaDir} {
		if err := os.Mkdir(p, 0700); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(filepath.Join(configDir, "quickstart"), []byte("config quickstart 'main'\n"), 0600); err != nil {
		t.Fatal(err)
	}
	wrapper := "#!/bin/sh\nexec \"$QUICKSTART_TEST_UCI\" -c \"$REVIEW_UCI_DIR\" -t \"$REVIEW_UCI_DELTA\" \"$@\"\n"
	if err := os.WriteFile(filepath.Join(dir, "uci"), []byte(wrapper), 0700); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", dir+":"+os.Getenv("PATH"))
	t.Setenv("REVIEW_UCI_DIR", configDir)
	t.Setenv("REVIEW_UCI_DELTA", deltaDir)
	svc := NewService(isolatedUCIStore{})
	for _, value := range []string{"plain", "My Files", "O'Brien", `a"b`, "$literal", "a;b #data", `C:\data`, "中文", ""} {
		if _, err := svc.Set(context.Background(), models.QuickstartConfigRequest{Key: "label", Type: "option", Values: []string{value}}); err != nil {
			t.Fatal(err)
		}
		resp, err := svc.Get(context.Background(), models.QuickstartGetConfigRequest{Key: "label"})
		// UCI treats an empty option as deletion; preserve this legacy behavior.
		if value == "" {
			if err == nil {
				t.Fatal("empty option was not cleared")
			}
			continue
		}
		if err != nil || !reflect.DeepEqual(resp.Result.Values, []string{value}) {
			t.Fatalf("option round trip %q: %#v, %v", value, resp, err)
		}
	}
	values := []string{"My Files", "O'Brien", "$literal"}
	if _, err := svc.Set(context.Background(), models.QuickstartConfigRequest{Key: "paths", Type: "list", Values: values}); err != nil {
		t.Fatal(err)
	}
	resp, err := svc.Get(context.Background(), models.QuickstartGetConfigRequest{Key: "paths"})
	if err != nil || resp.Result.Type != "list" || !reflect.DeepEqual(resp.Result.Values, values) {
		t.Fatalf("list round trip: %#v, %v", resp, err)
	}
	folders := models.GlobalFolders{Home: "/mnt/My Files", Configs: "/mnt/O'Brien", Public: "/mnt/中文", Downloads: "/mnt/$literal", Caches: ""}
	if _, err := svc.SetGlobalFolders(context.Background(), folders); err != nil {
		t.Fatal(err)
	}
	folderResp, err := svc.GetGlobalFolders(context.Background())
	if err != nil || !reflect.DeepEqual(folderResp.Result, &folders) {
		t.Fatalf("folder round trip: %#v, %v", folderResp, err)
	}
	if _, err := svc.Delete(context.Background(), models.QuickstartDeleteConfigRequest{Key: "paths"}); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Get(context.Background(), models.QuickstartGetConfigRequest{Key: "paths"}); err == nil {
		t.Fatal("delete did not remove value")
	}
}
