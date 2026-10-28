//go:build !linux

package main

import "fmt"

func readX86LogicalSectorSize(device string) (int, error) {
	return 0, fmt.Errorf("logical sector detection for %s requires Linux", device)
}
