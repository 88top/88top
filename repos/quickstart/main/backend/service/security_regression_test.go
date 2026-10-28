package service

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"github.com/istoreos/quickstart/backend/models"
	networkbasics "github.com/istoreos/quickstart/backend/modules/guidecore/networkbasics"
	"github.com/istoreos/quickstart/backend/modules/guidestorage/dockertransfer"
	"github.com/istoreos/quickstart/backend/modules/guidestorage/downloadservices"
	quickstartconfig "github.com/istoreos/quickstart/backend/modules/quickstart/config"
	"github.com/istoreos/quickstart/backend/utils"
)

// Capture actual argv after bash parsing; no real UCI, service or disk command
// is run. Values are ordinary filename/credential punctuation, never code.
func TestConfigurationValuesReachUCIAsLiteralArguments(t *testing.T) {
	dir := t.TempDir()
	capture := filepath.Join(dir, "argv")
	if err := os.WriteFile(filepath.Join(dir, "uci"), []byte("#!/bin/sh\nprintf '%s\\000' \"$@\" >> \"$REVIEW_ARGV\"\n"), 0700); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", dir+":"+os.Getenv("PATH"))
	t.Setenv("REVIEW_ARGV", capture)
	for _, value := range []string{"", "My Files", "O'Brien", `a"b`, "$literal", "a;b #data", `C:\data`, "中文"} {
		for _, tc := range []struct {
			name     string
			commands []string
			want     []string
		}{
			{"quickstart", quickstartconfig.BuildSetCommands(models.QuickstartConfigRequest{Key: "label", Values: []string{value}}), []string{"set", "quickstart.main.label=" + value, "commit", "quickstart"}},
			{"folders", quickstartconfig.BuildGlobalFoldersCommands(models.GlobalFolders{Home: "/mnt/" + value}), []string{"set", "quickstart.main.main_dir=/mnt/" + value, "set", "quickstart.main.conf_dir=", "set", "quickstart.main.pub_dir=", "set", "quickstart.main.dl_dir=", "set", "quickstart.main.tmp_dir=", "commit", "quickstart"}},
			{"pppoe", networkbasics.BuildPPPoECommands(value, value)[:3], []string{"set", "network.wan.proto=pppoe", "set", "network.wan.username=" + value, "set", "network.wan.password=" + value}},
			{"aria2", downloadservices.BuildAria2ConfigCommands(downloadservices.Aria2InitInput{ConfigPath: value, DownloadPath: value, RPCToken: value}), []string{"set", "aria2.main.rpc_auth_method=token", "set", "aria2.main.config_dir=" + value, "set", "aria2.main.dir=" + value, "set", "aria2.main.enabled=1", "set", "aria2.main.rpc_secret=" + value}},
			{"docker", dockertransfer.BuildUpdateCommands(value)[:2], []string{"set", "dockerd.globals.data_root=" + value, "commit", "dockerd"}},
		} {
			t.Run(tc.name+"/"+value, func(t *testing.T) {
				if err := os.Remove(capture); err != nil && !os.IsNotExist(err) {
					t.Fatal(err)
				}
				if err := utils.BatchRun(context.Background(), tc.commands, 5); err != nil {
					t.Fatal(err)
				}
				raw, err := os.ReadFile(capture)
				if err != nil {
					t.Fatal(err)
				}
				got := strings.Split(strings.TrimSuffix(string(raw), "\x00"), "\x00")
				if !reflect.DeepEqual(got, tc.want) {
					t.Fatalf("argv changed: got %q, want %q", got, tc.want)
				}
			})
		}
	}
}

func TestQuickstartFailedWriteDoesNotCommit(t *testing.T) {
	dir := t.TempDir()
	capture := filepath.Join(dir, "committed")
	stub := "#!/bin/sh\nif [ \"$1\" = set ]; then exit 1; fi\nprintf committed > \"$REVIEW_COMMIT\"\n"
	if err := os.WriteFile(filepath.Join(dir, "uci"), []byte(stub), 0700); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", dir+":"+os.Getenv("PATH"))
	t.Setenv("REVIEW_COMMIT", capture)
	err := (quickstartConfigStore{}).Run(context.Background(), []string{"uci set quickstart.main.key=value", "uci commit quickstart"})
	if err == nil {
		t.Fatal("failed mutation reported success")
	}
	if _, err := os.Stat(capture); !os.IsNotExist(err) {
		t.Fatal("committed after failed mutation")
	}
}

func TestSmartConfigRejectsBadRequestAndPropagatesWriteFailure(t *testing.T) {
	original := writeSmartConfig
	defer func() { writeSmartConfig = original }()
	writes := 0
	writeSmartConfig = func(string, []string) error { writes++; return errors.New("read-only filesystem") }
	for _, req := range []models.SmartConfigRequest{
		{},
		{Global: &models.SmartConfigGlobal{Powermode: "standby"}, Devices: []*models.SmartConfigDevice{nil}},
		{Global: &models.SmartConfigGlobal{Powermode: "standby"}, Tasks: []*models.SmartConfigTask{nil}},
		{Global: &models.SmartConfigGlobal{Powermode: "standby\n"}},
	} {
		if _, err := SmartPostConfigTyped(context.Background(), req); err == nil {
			t.Fatal("invalid config accepted")
		}
	}
	if writes != 0 {
		t.Fatal("invalid configuration reached file writer")
	}
	err := smartSetConfig(context.Background(), &models.SmartConfigRequest{Global: &models.SmartConfigGlobal{Powermode: "standby"}})
	if err == nil || err.Error() != "read-only filesystem" || writes != 1 {
		t.Fatalf("write error lost: %v, %d", err, writes)
	}
}

func TestSmartConfigWriteReplacesSymlinkAndPreservesLiteralContent(t *testing.T) {
	dir := t.TempDir()
	target, path := filepath.Join(dir, "other"), filepath.Join(dir, "smartd.conf")
	if err := os.WriteFile(target, []byte("keep"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(target, path); err != nil {
		t.Fatal(err)
	}
	lines := []string{"# 100% literal $data", "DEFAULT -n standby", "/dev/sda -W 5,0,50"}
	if err := writeSmartConfig(path, lines); err != nil {
		t.Fatal(err)
	}
	raw, _ := os.ReadFile(path)
	other, _ := os.ReadFile(target)
	info, _ := os.Lstat(path)
	if string(raw) != strings.Join(lines, "\n")+"\n" || string(other) != "keep" || info.Mode().Perm() != 0600 || !info.Mode().IsRegular() {
		t.Fatal("unsafe or incomplete config replacement")
	}
}

func TestInvalidWirelessIdentityIsRejectedBeforePlatformAccess(t *testing.T) {
	for _, name := range []string{"", "radio0.other", "radio0 extra", "guest;", "../radio0"} {
		if err := WirelessEnableIfaceWithRequest(context.Background(), models.WirelessEnableIfaceRequest{IfaceName: name}); err == nil {
			t.Fatal("invalid enable identity accepted")
		}
		if err := WirelessSetDevicePowerWithRequest(context.Background(), models.WirelessSetDevicePowerRequest{Device: name}); err == nil {
			t.Fatal("invalid power identity accepted")
		}
		if err := WirelessEditIfaceWithRequest(context.Background(), models.WirelessIfaceInfo{IfaceName: name}); err == nil {
			t.Fatal("invalid edit identity accepted")
		}
	}
	for _, name := range []string{"radio0", "cfg123abc", "guest2g", "@wifi-iface[0]"} {
		if !validWirelessSection(name) {
			t.Fatalf("normal wireless identity rejected: %s", name)
		}
	}
}

func TestReadonlyProbePreservesExistingFilesAndLinks(t *testing.T) {
	dir := t.TempDir()
	file, link := filepath.Join(dir, "user-data"), filepath.Join(dir, ".readonly_test")
	if err := os.WriteFile(file, []byte("user content"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(file, link); err != nil {
		t.Fatal(err)
	}
	if !directoryWritable(dir) {
		t.Fatal("writable directory reported read-only")
	}
	raw, err := os.ReadFile(link)
	if err != nil || string(raw) != "user content" {
		t.Fatalf("existing probe name damaged: %q, %v", raw, err)
	}
	entries, err := os.ReadDir(dir)
	if err != nil || len(entries) != 2 {
		t.Fatal("probe leaked temporary files")
	}
	if directoryWritable("") || directoryWritable(filepath.Join(dir, "missing")) {
		t.Fatal("invalid directory accepted")
	}
}

func TestDockerTransferPreservesQuotedPathsAndExistingDecisions(t *testing.T) {
	for _, mode := range []string{"missing", "empty", "warn", "overwrite", "path-only"} {
		t.Run(mode, func(t *testing.T) {
			dir := t.TempDir()
			source, target := filepath.Join(dir, "source O'Brien $literal"), filepath.Join(dir, "target O'Brien $literal")
			if err := os.Mkdir(source, 0700); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(filepath.Join(source, "100% data"), []byte("source content"), 0600); err != nil {
				t.Fatal(err)
			}
			if mode != "missing" {
				if err := os.Mkdir(target, 0700); err != nil {
					t.Fatal(err)
				}
			}
			if mode == "warn" || mode == "overwrite" || mode == "path-only" {
				if err := os.WriteFile(filepath.Join(target, "existing"), []byte("keep"), 0600); err != nil {
					t.Fatal(err)
				}
			}
			result, err := transferDockerPath(context.Background(), target, mode == "overwrite" || mode == "path-only", mode == "overwrite", source)
			if mode == "warn" {
				if err == nil || result == nil || !result.EmptyPathWarning {
					t.Fatal("existing-directory confirmation lost")
				}
			} else if err != nil {
				t.Fatal(err)
			}
			if mode == "warn" || mode == "path-only" {
				raw, _ := os.ReadFile(filepath.Join(target, "existing"))
				if string(raw) != "keep" {
					t.Fatal("existing data changed without overwrite")
				}
				if _, err := os.Stat(filepath.Join(target, "100% data")); !os.IsNotExist(err) {
					t.Fatal("unexpected data copy")
				}
			} else {
				raw, _ := os.ReadFile(filepath.Join(target, "100% data"))
				if string(raw) != "source content" {
					t.Fatal("literal-path copy failed")
				}
				if _, err := os.Stat(filepath.Join(target, "existing")); !os.IsNotExist(err) {
					t.Fatal("overwrite did not replace target")
				}
			}
			raw, _ := os.ReadFile(filepath.Join(source, "100% data"))
			if string(raw) != "source content" {
				t.Fatal("source content changed")
			}
		})
	}
}
