package main

import (
	"os"

	"golang.org/x/sys/unix"
)

func readX86LogicalSectorSize(device string) (int, error) {
	return x86LogicalSectorSize(device, "/sys/class/block", func(path string) (int, error) {
		// Detection never opens the device for writing.
		file, err := os.Open(path)
		if err != nil {
			return 0, err
		}
		defer file.Close()
		return unix.IoctlGetInt(int(file.Fd()), unix.BLKSSZGET)
	})
}
