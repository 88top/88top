package service

import (
	"os"
	"path/filepath"
	"strings"
)

var writeSmartConfig = func(path string, lines []string) error {
	f, err := os.CreateTemp(filepath.Dir(path), ".quickstart-smartd-*")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	defer f.Close()
	if err := f.Chmod(0600); err != nil {
		return err
	}
	if _, err := f.WriteString(strings.Join(lines, "\n") + "\n"); err != nil {
		return err
	}
	if err := f.Sync(); err != nil {
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	return os.Rename(f.Name(), path)
}
