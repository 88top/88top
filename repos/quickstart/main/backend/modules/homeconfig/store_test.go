package homeconfig

import (
	"bytes"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"testing"
)

func emptyLayout(t *testing.T) []byte {
	t.Helper()
	prefs := map[string]Preference{}
	for _, id := range widgets {
		prefs[id] = Preference{Mode: "auto", RuleVersion: 2}
	}
	raw, err := json.Marshal(Layout{SchemaVersion: 3, Rows: []Row{}, WidgetPreferences: prefs})
	if err != nil {
		t.Fatal(err)
	}
	return raw
}
func launcher(pins ...string) []byte {
	raw, _ := json.Marshal(Launcher{SchemaVersion: 1, Favorites: append([]string{}, pins...), Links: []Link{}})
	return raw
}
func readFile(t *testing.T, path string) []byte {
	t.Helper()
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return raw
}
func writeFile(t *testing.T, path string, raw []byte) {
	t.Helper()
	if err := os.WriteFile(path, raw, 0600); err != nil {
		t.Fatal(err)
	}
}

func TestMissingReadDoesNotWriteAndEmptySurvivesRestart(t *testing.T) {
	root := filepath.Join(t.TempDir(), "config")
	s := NewStore(root)
	got, err := s.Read("layout")
	if err != nil || got.State != "missing" || got.Version != "missing" {
		t.Fatalf("%+v %v", got, err)
	}
	if _, err := os.Stat(root); !errors.Is(err, os.ErrNotExist) {
		t.Fatal("read created directory")
	}
	saved, err := s.Save("layout", got.Version, emptyLayout(t))
	if err != nil || saved.State != "saved" {
		t.Fatalf("%+v %v", saved, err)
	}
	got, err = NewStore(root).Read("layout")
	if err != nil || got.Version != saved.Version || !bytes.Equal(got.Value, saved.Value) {
		t.Fatalf("restart lost empty layout: %+v %v", got, err)
	}
	info, _ := os.Stat(filepath.Join(root, "home-layout.json"))
	if info.Mode().Perm() != 0600 {
		t.Fatal("configuration is not private")
	}
	if _, err := os.Stat(filepath.Join(root, "home-layout.json.bak")); err != nil {
		t.Fatal("first save has no valid backup", err)
	}
}

func TestIndependentDomainsNoOpAndConflict(t *testing.T) {
	root := t.TempDir()
	s := NewStore(root)
	layout, err := s.Save("layout", "missing", emptyLayout(t))
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(root, "home-layout.json")
	before := readFile(t, path)
	writes := 0
	s.write = func(path string, raw []byte) error { writes++; return atomicWrite(path, raw) }
	noOp, err := s.Save("layout", layout.Version, emptyLayout(t))
	if err != nil || noOp.Version != layout.Version || writes != 0 {
		t.Fatalf("no-op wrote flash: %d %v", writes, err)
	}
	first, err := s.Save("launcher", "missing", launcher("tool-lan"))
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(before, readFile(t, path)) {
		t.Fatal("launcher changed layout")
	}
	second, err := s.Save("launcher", first.Version, launcher("tool-terminal"))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.Save("launcher", first.Version, launcher("tool-dns")); !errors.Is(err, ErrConflict) {
		t.Fatal("stale update accepted", err)
	}
	if _, err := s.Save("launcher", "", launcher()); !errors.Is(err, ErrConflict) {
		t.Fatal("missing expected version accepted")
	}
	got, _ := s.Read("launcher")
	if got.Version != second.Version {
		t.Fatal("conflict changed configuration")
	}
}

func TestIndependentProcessesSerializeVersionCheck(t *testing.T) {
	root := t.TempDir()
	first, err := NewStore(root).Save("launcher", "missing", launcher())
	if err != nil {
		t.Fatal(err)
	}
	var wg sync.WaitGroup
	results := make(chan error, 2)
	for _, id := range []string{"tool-lan", "tool-dns"} {
		wg.Add(1)
		go func(id string) {
			defer wg.Done()
			_, err := NewStore(root).Save("launcher", first.Version, launcher(id))
			results <- err
		}(id)
	}
	wg.Wait()
	close(results)
	successes, conflicts := 0, 0
	for err := range results {
		if err == nil {
			successes++
		} else if errors.Is(err, ErrConflict) {
			conflicts++
		} else {
			t.Fatal(err)
		}
	}
	if successes != 1 || conflicts != 1 {
		t.Fatalf("successes=%d conflicts=%d", successes, conflicts)
	}
}

func TestDamagedFutureAndBackupNeverAutoOverwrite(t *testing.T) {
	root := t.TempDir()
	s := NewStore(root)
	one, _ := s.Save("launcher", "missing", launcher("tool-lan"))
	two, err := s.Save("launcher", one.Version, launcher("tool-terminal"))
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(root, "home-launcher.json")
	good := readFile(t, path)
	for _, bad := range [][]byte{nil, []byte("{"), bytes.Repeat([]byte("x"), MaxBytes+1)} {
		writeFile(t, path, bad)
		got, err := s.Read("launcher")
		if err != nil || got.State != "backup" || got.Version != one.Version {
			t.Fatalf("backup: %+v %v", got, err)
		}
		if _, err := s.Save("launcher", got.Version, launcher()); !errors.Is(err, ErrReadOnly) {
			t.Fatal("damaged primary overwritten", err)
		}
		if !bytes.Equal(readFile(t, path), bad) {
			t.Fatal("read/save repaired without explicit recovery")
		}
	}
	if err := os.Remove(path); err != nil {
		t.Fatal(err)
	}
	got, _ := s.Read("launcher")
	if got.State != "backup" {
		t.Fatal("surviving backup misclassified as fresh installation")
	}
	var future envelope
	if err := json.Unmarshal(good, &future); err != nil {
		t.Fatal(err)
	}
	future.Value = []byte(`{"schemaVersion":42,"newSettings":{"keep":true}}`)
	raw, _ := json.Marshal(future)
	writeFile(t, path, raw)
	got, _ = s.Read("launcher")
	if got.State != "future" || got.Value != nil {
		t.Fatal("future document downgraded", got)
	}
	if _, err := s.Save("launcher", two.Version, launcher()); !errors.Is(err, ErrReadOnly) {
		t.Fatal(err)
	}
	if !bytes.Equal(raw, readFile(t, path)) {
		t.Fatal("future input modified")
	}
	writeFile(t, path, []byte("broken"))
	writeFile(t, path+".bak", []byte("broken"))
	got, _ = s.Read("launcher")
	if got.State != "damaged" {
		t.Fatal(got)
	}
}

func TestWriteFailuresAndUncertainCommit(t *testing.T) {
	for _, stage := range []string{"backup", "primary", "after-rename"} {
		t.Run(stage, func(t *testing.T) {
			root := t.TempDir()
			s := NewStore(root)
			first, err := s.Save("launcher", "missing", launcher("tool-lan"))
			if err != nil {
				t.Fatal(err)
			}
			path := filepath.Join(root, "home-launcher.json")
			before := readFile(t, path)
			s.write = func(target string, raw []byte) error {
				if stage == "backup" && target == path+".bak" || stage == "primary" && target == path {
					return errors.New("simulated read-only/full/interrupted write")
				}
				if err := atomicWrite(target, raw); err != nil {
					return err
				}
				if stage == "after-rename" && target == path {
					return ErrUncertain
				}
				return nil
			}
			_, err = s.Save("launcher", first.Version, launcher("tool-dns"))
			if err == nil {
				t.Fatal("write failure reported success")
			}
			got, readErr := NewStore(root).Read("launcher")
			if readErr != nil {
				t.Fatal(readErr)
			}
			if stage == "after-rename" {
				if !errors.Is(err, ErrUncertain) || got.Version == first.Version {
					t.Fatal("readback did not resolve committed write")
				}
			} else if got.Version != first.Version || !bytes.Equal(before, readFile(t, path)) {
				t.Fatal("failure lost previous primary")
			}
			entries, _ := filepath.Glob(filepath.Join(root, ".home-config-*"))
			if len(entries) != 0 {
				t.Fatal("temporary files leaked")
			}
		})
	}
}

func TestLinkDeletionMustRemovePinAtomically(t *testing.T) {
	root := t.TempDir()
	s := NewStore(root)
	value := []byte(`{"schemaVersion":1,"favorites":["user-link:nas"],"links":[{"id":"user-link:nas","name":"私人 NAS","url":"https://nas.example/path?key=private","glyph":"folder"}]}`)
	first, err := s.Save("launcher", "missing", value)
	if err != nil {
		t.Fatal(err)
	}
	bad := []byte(`{"schemaVersion":1,"favorites":["user-link:nas"],"links":[]}`)
	if _, err := s.Save("launcher", first.Version, bad); !errors.Is(err, ErrInvalid) {
		t.Fatal("orphaned reference accepted")
	}
	got, _ := s.Read("launcher")
	if got.Version != first.Version {
		t.Fatal("partial deletion committed")
	}
	if _, err := s.Save("launcher", first.Version, launcher()); err != nil {
		t.Fatal("atomic deletion rejected", err)
	}
}

func TestStrictContractRejectsUntrustedStructures(t *testing.T) {
	base := emptyLayout(t)
	var layout Layout
	json.Unmarshal(base, &layout)
	id := "connection"
	layout.Rows = []Row{{ID: "network", Template: "single", Height: 320, HeightMode: "content", Columns: []Column{{Weight: 100, Split: 50, Cards: []*string{&id}}}}}
	valid, _ := json.Marshal(layout)
	if _, err := Canonical("layout", valid); err != nil {
		t.Fatal(err)
	}
	for _, mutate := range []func(*Layout){
		func(d *Layout) { d.Rows = append(d.Rows, d.Rows[0]) },
		func(d *Layout) { d.Rows[0].Columns[0].Weight = 99 },
		func(d *Layout) { d.Rows[0].Template = "recursive" },
		func(d *Layout) { d.Rows[0].Height = 1601 },
		func(d *Layout) { d.WidgetPreferences["traffic"] = Preference{Mode: "summary"} },
		func(d *Layout) { d.WidgetPreferences["system"] = Preference{Mode: "auto", IconRows: 1} },
	} {
		var candidate Layout
		json.Unmarshal(valid, &candidate)
		mutate(&candidate)
		raw, _ := json.Marshal(candidate)
		if _, err := Canonical("layout", raw); !errors.Is(err, ErrInvalid) {
			t.Fatalf("accepted invalid layout: %s", raw)
		}
	}
	for _, raw := range [][]byte{
		[]byte(`{"schemaVersion":1,"favorites":[],"links":[{"id":"user-link:1","name":null,"url":"https://example.com/","glyph":"globe"}]}`),
		[]byte(`{"schemaVersion":1,"favorites":[],"links":[],"code":"eval()"}`),
		[]byte(`{"schemaVersion":1,"favorites":[],"favorites":["evil"],"links":[]}`),
		[]byte(`{"schemaVersion":1,"favorites":null,"links":[]}`),
		append(launcher(), []byte(` {}`)...),
	} {
		if _, err := Canonical("launcher", raw); !errors.Is(err, ErrInvalid) {
			t.Fatal("invalid JSON accepted", err)
		}
	}
	for _, url := range []string{"javascript:alert(1)", "file:///etc/passwd", "https://user:secret@example.com", "https://example.com\\bad", "https://example.com/ bad", "https:///missing"} {
		doc := Launcher{SchemaVersion: 1, Favorites: []string{}, Links: []Link{{ID: "user-link:1", Name: "link", URL: url, Glyph: "globe"}}}
		raw, _ := json.Marshal(doc)
		if _, err := Canonical("launcher", raw); !errors.Is(err, ErrInvalid) {
			t.Fatalf("accepted unsafe URL %q", url)
		}
	}
}

func TestExplicitBackupRecoveryKeepsDamagedEvidenceAndInvalidatesVersions(t *testing.T) {
	root := t.TempDir()
	s := NewStore(root)
	first, err := s.Save("launcher", "missing", launcher("tool-lan"))
	if err != nil {
		t.Fatal(err)
	}
	if _, err = s.Save("launcher", first.Version, launcher("tool-dns")); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(root, "home-launcher.json")
	bad := []byte("truncated{")
	writeFile(t, path, bad)
	current, err := s.Read("launcher")
	if err != nil || current.State != "backup" || current.RecoveryVersion == "" {
		t.Fatalf("%+v %v", current, err)
	}
	if _, err = s.RestoreBackup("launcher", "stale"); !errors.Is(err, ErrConflict) {
		t.Fatal("stale recovery accepted", err)
	}
	if _, err = os.Stat(path + ".damaged"); !errors.Is(err, os.ErrNotExist) {
		t.Fatal("stale recovery wrote archive")
	}
	restored, err := s.RestoreBackup("launcher", current.RecoveryVersion)
	if err != nil {
		t.Fatal(err)
	}
	if restored.Version == first.Version || !bytes.Equal(restored.Value, first.Value) {
		t.Fatal("recovery did not start a new generation")
	}
	if !bytes.Equal(readFile(t, path+".damaged"), bad) {
		t.Fatal("damaged evidence lost")
	}
	if _, err = s.Save("launcher", first.Version, launcher("tool-source")); !errors.Is(err, ErrConflict) {
		t.Fatal("pre-recovery session accepted")
	}
}
