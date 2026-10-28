package homeconfig

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestDamagedResetRequiresTokenAndKeepsBothOriginals(t *testing.T) {
	root := t.TempDir()
	store := NewStore(root)
	path := filepath.Join(root, "home-launcher.json")
	primary, backup := []byte("truncated primary"), []byte("truncated backup")
	os.WriteFile(path, primary, 0600)
	os.WriteFile(path+".bak", backup, 0600)
	current, err := store.Read("launcher")
	if err != nil || current.State != "damaged" {
		t.Fatal(current, err)
	}
	if _, err = store.RestoreDefaults("launcher", "stale"); !errors.Is(err, ErrConflict) {
		t.Fatal("stale reset", err)
	}
	restored, err := store.RestoreDefaults("launcher", current.RecoveryVersion)
	if err != nil || restored.State != "saved" {
		t.Fatal(restored, err)
	}
	if !bytes.Equal(readFile(t, path+".damaged"), primary) || !bytes.Equal(readFile(t, path+".bak.damaged"), backup) {
		t.Fatal("original evidence replaced")
	}
	want, err := InitialValue("launcher", LegacySettings{})
	if err != nil || !bytes.Equal(restored.Value, want) {
		t.Fatal("wrong defaults", err)
	}
	if _, err = store.RestoreDefaults("launcher", current.RecoveryVersion); !errors.Is(err, ErrReadOnly) {
		t.Fatal("reset overwrote valid save", err)
	}
}
func TestFutureCannotBeResetOrRecoveredByOldVersion(t *testing.T) {
	root := t.TempDir()
	store := NewStore(root)
	saved, err := store.Save("launcher", "missing", launcher())
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(root, "home-launcher.json")
	raw := bytes.Replace(readFile(t, path), []byte(`"schemaVersion":1`), []byte(`"schemaVersion":99`), 1)
	os.WriteFile(path, raw, 0600)
	current, err := store.Read("launcher")
	if err != nil || current.State != "future" {
		t.Fatal(current, err, saved)
	}
	if _, err = store.RestoreDefaults("launcher", current.RecoveryVersion); !errors.Is(err, ErrReadOnly) {
		t.Fatal("future downgraded", err)
	}
	if !bytes.Equal(readFile(t, path), raw) {
		t.Fatal("future file changed")
	}
}
