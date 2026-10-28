package utils

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestUCIQuoteRoundTripWithRealUCI(t *testing.T) {
	uci := os.Getenv("QUICKSTART_TEST_UCI")
	if uci == "" {
		t.Skip("set QUICKSTART_TEST_UCI to a real UCI executable")
	}
	dir := t.TempDir()
	delta := filepath.Join(dir, "delta")
	if err := os.Mkdir(delta, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "fixture"), []byte("config user 'main'\n"), 0600); err != nil {
		t.Fatal(err)
	}
	for _, value := range []string{"two words", "O'Brien", `a"b`, "$literal", "a;b #data", `C:\data`, "中文", ""} {
		cmd := exec.CommandContext(context.Background(), uci, "-c", dir, "-t", delta, "batch")
		cmd.Stdin = strings.NewReader("set fixture.main.value=" + UCIQuote(value) + "\ncommit fixture\n")
		if out, err := cmd.CombinedOutput(); err != nil {
			t.Fatalf("batch: %s, %v", out, err)
		}
		out, err := exec.Command(uci, "-c", dir, "-t", delta, "get", "fixture.main.value").Output()
		if value == "" {
			if err == nil {
				t.Fatal("empty UCI option was not cleared")
			}
			continue
		}
		if err != nil || strings.TrimSuffix(string(out), "\n") != value {
			t.Fatalf("round trip %q: %q, %v", value, out, err)
		}
	}
}
