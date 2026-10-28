package utils

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestUCIBatchDoesNotExecuteValueAsShell(t *testing.T) {
	dir := t.TempDir()
	capture, marker := filepath.Join(dir, "input"), filepath.Join(dir, "executed")
	if err := os.WriteFile(filepath.Join(dir, "uci"), []byte("#!/bin/sh\ncat > \"$UCI_TEST_CAPTURE\"\n"), 0700); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", dir+":"+os.Getenv("PATH"))
	t.Setenv("UCI_TEST_CAPTURE", capture)
	command := "set quickstart.test.value='$(touch " + marker + ")'"
	if err := UCIBatchRun(context.Background(), []string{command}, "", 5); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(marker); !os.IsNotExist(err) {
		t.Fatal("UCI value executed shell command substitution")
	}
	got, err := os.ReadFile(capture)
	if err != nil || strings.TrimSpace(string(got)) != command {
		t.Fatalf("UCI input changed: %q, %v", got, err)
	}
}
