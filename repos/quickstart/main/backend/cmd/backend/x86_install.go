package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/istoreos/quickstart/backend/service"
	"github.com/manifoldco/promptui"
)

// Keep the compatibility gate local to the installer: 4Kn data disks remain usable.
type x86Installer struct {
	selectPrompt      func(promptui.Select) (int, string, error)
	logicalSectorSize func(string) (int, error)
	install           func(service.DiskInfoForX86Root, service.DiskInfoForX86Dev) error
	output            io.Writer
}

func (installer x86Installer) checkSectorSizes(root service.DiskInfoForX86Root, dev service.DiskInfoForX86Dev) error {
	for _, disk := range []struct{ role, path string }{
		{"source", "/dev/" + root.Name},
		{"target", dev.Target},
	} {
		size, err := installer.logicalSectorSize(disk.path)
		if err != nil {
			return fmt.Errorf("cannot detect logical sector size of %s %s: %w; no disks were unmounted or written", disk.role, disk.path, err)
		}
		if size != 512 {
			return fmt.Errorf("%s %s reports a %d-byte logical sector size; this installer only supports 512-byte logical sectors; no disks were unmounted or written", disk.role, disk.path, size)
		}
	}
	return nil
}

// Probe the actual device used for copying, including dm-* sources used by Ventoy.
// Physical sector size deliberately does not decide compatibility (512e is valid).
func x86LogicalSectorSize(device, sysfsRoot string, ioctlSize func(string) (int, error)) (int, error) {
	data, sysfsErr := os.ReadFile(filepath.Join(sysfsRoot, filepath.Base(device), "queue", "logical_block_size"))
	if sysfsErr == nil {
		size, err := strconv.Atoi(strings.TrimSpace(string(data)))
		if err == nil && size > 0 {
			return size, nil
		}
		sysfsErr = fmt.Errorf("invalid sysfs logical sector size %q", strings.TrimSpace(string(data)))
	}
	size, err := ioctlSize(device)
	if err != nil {
		return 0, fmt.Errorf("sysfs: %v; BLKSSZGET: %w", sysfsErr, err)
	}
	if size <= 0 {
		return 0, fmt.Errorf("BLKSSZGET returned invalid logical sector size %d", size)
	}
	return size, nil
}
