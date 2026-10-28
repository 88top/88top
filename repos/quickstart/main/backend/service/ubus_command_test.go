package service

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestUbusPreservesJSONArgumentContainingSpaces(t *testing.T) {
	dir := t.TempDir()
	capture := filepath.Join(dir, "argument")
	if err := os.WriteFile(filepath.Join(dir, "ubus"), []byte("#!/bin/sh\nprintf '%s' \"$5\" > \"$UBUS_TEST_CAPTURE\"\nprintf '{}'\n"), 0700); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", dir+":"+os.Getenv("PATH"))
	t.Setenv("UBUS_TEST_CAPTURE", capture)
	const payload = `{"username":"root","password":"two words"}`
	if _, err := UbusCall(context.Background(), "luci setPassword "+payload); err != nil {
		t.Fatal(err)
	}
	got, err := os.ReadFile(capture)
	if err != nil || string(got) != payload {
		t.Fatalf("argument=%q, error=%v", got, err)
	}
	var result map[string]any
	if err := UbusCallWithObject(context.Background(), "luci setPassword "+payload, &result); err != nil {
		t.Fatal(err)
	}
	got, err = os.ReadFile(capture)
	if err != nil || string(got) != payload {
		t.Fatalf("argument=%q, error=%v", got, err)
	}
}
