package main

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestReadX86LogicalSectorSizeRejectsUnavailableDevice(t *testing.T) {
	path := filepath.Join(t.TempDir(), "quickstart-sector-test-missing-device")
	size, err := readX86LogicalSectorSize(path)
	if size != 0 || !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("missing device: size=%d, err=%v", size, err)
	}
}

func TestReadX86LogicalSectorSizeDoesNotWriteDuringDetection(t *testing.T) {
	path := filepath.Join(t.TempDir(), "quickstart-sector-test-regular-file")
	before := []byte("existing data must survive a failed sector probe")
	if err := os.WriteFile(path, before, 0644); err != nil {
		t.Fatal(err)
	}
	size, err := readX86LogicalSectorSize(path)
	if size != 0 || err == nil {
		t.Fatalf("regular file accepted as a block device: size=%d, err=%v", size, err)
	}
	after, err := os.ReadFile(path)
	if err != nil || !bytes.Equal(before, after) {
		t.Fatalf("probe changed existing data: data=%q, err=%v", after, err)
	}
}
