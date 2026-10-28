package main

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"github.com/istoreos/quickstart/backend/service"
	"github.com/manifoldco/promptui"
)

func writeSectorFixture(t *testing.T, root, name, logical, physical string) {
	t.Helper()
	queue := filepath.Join(root, name, "queue")
	if err := os.MkdirAll(queue, 0755); err != nil {
		t.Fatal(err)
	}
	for name, value := range map[string]string{"logical_block_size": logical, "physical_block_size": physical} {
		if err := os.WriteFile(filepath.Join(queue, name), []byte(value+"\n"), 0644); err != nil {
			t.Fatal(err)
		}
	}
}

func installFixture() *service.DiskInfoForX86Install {
	return &service.DiskInfoForX86Install{
		Root: service.DiskInfoForX86Root{Name: "sda", End: 1024, PType: "GPT"},
		Devs: []service.DiskInfoForX86Dev{{Name: "nvme0n1", Target: "/dev/nvme0n1", Mountpoints: []string{"/mnt/data"}}},
	}
}

func scriptedInstallPrompts(t *testing.T, answers ...string) func(promptui.Select) (int, string, error) {
	t.Helper()
	position := 0
	t.Cleanup(func() {
		if position != len(answers) {
			t.Errorf("used %d prompts, want %d", position, len(answers))
		}
	})
	return func(prompt promptui.Select) (int, string, error) {
		t.Helper()
		if position >= len(answers) {
			t.Fatalf("unexpected prompt: %s", prompt.Label)
		}
		answer := answers[position]
		position++
		for index, item := range prompt.Items.([]string) {
			if item == answer || strings.HasPrefix(item, answer+" [ ") {
				return index, item, nil
			}
		}
		t.Fatalf("answer %q missing from prompt %q", answer, prompt.Label)
		return 0, "", nil
	}
}

func TestX86InstallSectorCompatibility(t *testing.T) {
	for _, tc := range []struct {
		name, sourceLogical, targetLogical, physical, wantWarning string
	}{
		{"512n", "512", "512", "512", ""},
		{"512e", "512", "512", "4096", ""},
		{"target 4Kn", "512", "4096", "4096", "target /dev/nvme0n1 reports a 4096-byte logical sector size"},
		{"source 4Kn", "4096", "512", "4096", "source /dev/sda reports a 4096-byte logical sector size"},
		{"both 4Kn", "4096", "4096", "4096", "source /dev/sda reports a 4096-byte logical sector size"},
		{"other sector size", "512", "1024", "4096", "1024-byte logical sector size"},
		{"source detection failure", "invalid", "512", "512", "cannot detect logical sector size of source /dev/sda"},
		{"target detection failure", "512", "invalid", "512", "cannot detect logical sector size of target /dev/nvme0n1"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			sysfs := t.TempDir()
			writeSectorFixture(t, sysfs, "sda", tc.sourceLogical, tc.physical)
			writeSectorFixture(t, sysfs, "nvme0n1", tc.targetLogical, tc.physical)
			info := installFixture()
			answers := []string{"/dev/nvme0n1", "OK, Continue", "Install And Reboot"}
			if tc.wantWarning != "" {
				answers = []string{"/dev/nvme0n1", "QUIT"}
			}
			var output bytes.Buffer
			var operations []string
			installer := x86Installer{
				selectPrompt: scriptedInstallPrompts(t, answers...),
				logicalSectorSize: func(path string) (int, error) {
					return x86LogicalSectorSize(path, sysfs, func(string) (int, error) {
						return 0, errors.New("device ioctl unavailable")
					})
				},
				// All destructive work is behind this boundary in production.
				install: func(root service.DiskInfoForX86Root, dev service.DiskInfoForX86Dev) error {
					if root != info.Root || !reflect.DeepEqual(dev, info.Devs[0]) {
						t.Fatal("installation arguments changed")
					}
					operations = append(operations, "unmount", "write", "reboot")
					return nil
				},
				output: &output,
			}
			if err := installer.run(info); err != nil {
				t.Fatal(err)
			}
			if tc.wantWarning != "" {
				if len(operations) != 0 {
					t.Fatalf("rejected installation performed operations: %v", operations)
				}
				for _, want := range []string{"Installation refused:", tc.wantWarning, "no disks were unmounted or written"} {
					if !strings.Contains(output.String(), want) {
						t.Errorf("output %q missing %q", output.String(), want)
					}
				}
			} else if !reflect.DeepEqual(operations, []string{"unmount", "write", "reboot"}) || output.Len() != 0 {
				t.Fatalf("compatible installation: operations=%v, output=%q", operations, output.String())
			}
		})
	}
}

func TestX86InstallRechecksBeforeUnmountOrWrite(t *testing.T) {
	for _, tc := range []struct {
		name, path string
		size       int
		err        error
	}{
		{"source changed to 4Kn", "/dev/sda", 4096, nil},
		{"target changed to 4Kn", "/dev/nvme0n1", 4096, nil},
		{"source disappeared", "/dev/sda", 0, os.ErrNotExist},
		{"target disappeared", "/dev/nvme0n1", 0, os.ErrNotExist},
		{"source unknown", "/dev/sda", 0, nil},
		{"target invalid", "/dev/nvme0n1", -1, nil},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			reads := make(map[string]int)
			var output bytes.Buffer
			installer := x86Installer{
				selectPrompt: scriptedInstallPrompts(t, "/dev/nvme0n1", "OK, Continue", "Install And Reboot", "QUIT"),
				logicalSectorSize: func(path string) (int, error) {
					reads[path]++
					if path == tc.path && reads[path] == 2 {
						return tc.size, tc.err
					}
					return 512, nil
				},
				install: func(service.DiskInfoForX86Root, service.DiskInfoForX86Dev) error {
					t.Fatal("refused installation reached unmount/write/reboot boundary")
					return nil
				},
				output: &output,
			}
			if err := installer.run(installFixture()); err != nil {
				t.Fatal(err)
			}
			if reads[tc.path] != 2 || !strings.Contains(output.String(), "Installation refused:") {
				t.Fatalf("missing final check: reads=%v, output=%q", reads, output.String())
			}
		})
	}
}

func TestX86InstallCanSelectAnotherDiskAfterRefusal(t *testing.T) {
	info := installFixture()
	info.Root.Name = "dm-0" // Ventoy source; check the actual mapped device.
	info.Devs = append(info.Devs, service.DiskInfoForX86Dev{Name: "sdb", Target: "/dev/sdb"})
	var output bytes.Buffer
	var installed []string
	installer := x86Installer{
		selectPrompt: scriptedInstallPrompts(t, "/dev/nvme0n1", "/dev/sdb", "OK, Continue", "Install And Reboot"),
		logicalSectorSize: func(path string) (int, error) {
			if path == "/dev/nvme0n1" {
				return 4096, nil
			}
			if path != "/dev/dm-0" && path != "/dev/sdb" {
				t.Fatalf("unexpected device checked: %s", path)
			}
			return 512, nil
		},
		install: func(root service.DiskInfoForX86Root, dev service.DiskInfoForX86Dev) error {
			installed = append(installed, dev.Target)
			return nil
		},
		output: &output,
	}
	if err := installer.run(info); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(installed, []string{"/dev/sdb"}) || strings.Count(output.String(), "Installation refused:") != 1 {
		t.Fatalf("installed=%v, output=%q", installed, output.String())
	}
}

func TestX86InstallCancelDoesNotInstall(t *testing.T) {
	for _, answers := range [][]string{
		{"QUIT"},
		{"/dev/nvme0n1", "NO", "QUIT"},
		{"/dev/nvme0n1", "OK, Continue", "NO", "QUIT"},
		{"/dev/nvme0n1", "OK, Continue", "QUIT"},
	} {
		t.Run(strings.Join(answers, "/"), func(t *testing.T) {
			var output bytes.Buffer
			installer := x86Installer{
				selectPrompt:      scriptedInstallPrompts(t, answers...),
				logicalSectorSize: func(string) (int, error) { return 512, nil },
				install: func(service.DiskInfoForX86Root, service.DiskInfoForX86Dev) error {
					t.Fatal("cancel reached unmount/write/reboot boundary")
					return nil
				},
				output: &output,
			}
			if err := installer.run(installFixture()); err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestX86LogicalSectorSizeFallback(t *testing.T) {
	for _, tc := range []struct {
		name, logical string
		ioctlSize     int
		ioctlErr      error
		wantSize      int
		wantErr       bool
	}{
		{"missing sysfs 512", "", 512, nil, 512, false},
		{"missing sysfs 4096", "", 4096, nil, 4096, false},
		{"malformed sysfs", "garbage", 512, nil, 512, false},
		{"zero sysfs", "0", 512, nil, 512, false},
		{"negative sysfs", "-1", 512, nil, 512, false},
		{"empty sysfs", " ", 512, nil, 512, false},
		{"both unavailable", "", 0, os.ErrPermission, 0, true},
		{"zero ioctl", "", 0, nil, 0, true},
		{"negative ioctl", "", -1, nil, 0, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			sysfs := t.TempDir()
			if tc.logical != "" {
				writeSectorFixture(t, sysfs, "dm-0", tc.logical, "4096")
			}
			calls := 0
			size, err := x86LogicalSectorSize("/dev/dm-0", sysfs, func(path string) (int, error) {
				calls++
				if path != "/dev/dm-0" {
					t.Fatalf("ioctl called for %s", path)
				}
				return tc.ioctlSize, tc.ioctlErr
			})
			if size != tc.wantSize || (err != nil) != tc.wantErr || calls != 1 {
				t.Fatalf("size=%d, err=%v, ioctl calls=%d", size, err, calls)
			}
			if tc.ioctlErr != nil && !errors.Is(err, tc.ioctlErr) {
				t.Fatalf("ioctl cause lost: %v", err)
			}
		})
	}
}

func TestX86LogicalSectorSizeUsesSysfsWithoutIoctl(t *testing.T) {
	for _, name := range []string{"sda", "nvme0n1", "dm-0"} {
		t.Run(name, func(t *testing.T) {
			sysfs := t.TempDir()
			writeSectorFixture(t, sysfs, name, "512", "4096")
			size, err := x86LogicalSectorSize("/dev/"+name, sysfs, func(string) (int, error) {
				t.Fatal("valid sysfs should not require ioctl or opening the device")
				return 0, nil
			})
			if size != 512 || err != nil {
				t.Fatalf("size=%d, err=%v", size, err)
			}
		})
	}
}
