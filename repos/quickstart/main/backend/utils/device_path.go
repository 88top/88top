package utils

import (
	"path/filepath"
	"strings"
)

// ValidDevicePath checks the namespace before a device argument reaches a
// command. Destructive callers must also match it against their inventory.
func ValidDevicePath(path string) bool {
	return strings.HasPrefix(path, "/dev/") && len(path) > len("/dev/") && filepath.Clean(path) == path && !strings.ContainsAny(path, "\x00\r\n")
}
