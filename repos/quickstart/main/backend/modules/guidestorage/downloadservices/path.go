package downloadservices

import (
	"errors"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/istoreos/quickstart/backend/utils"
)

func ValidateDownloadPath(path string) error {
	if !filepath.IsAbs(path) {
		return errors.New("路径错误，请输入绝对路径")
	}
	clean := filepath.Clean(path)
	if !strings.ContainsAny(path, "\x00\r\n") && (strings.HasPrefix(clean, "/mnt/") || strings.HasPrefix(clean, "/root/")) {
		return nil
	}
	return errors.New("路径错误，必须选择硬盘的路径或者/root的路径")
}

func BuildEnsureDownloadDirCommands(path string) []string {
	return []string{
		fmt.Sprintf("if [ ! -d %v ]; then mkdir -p %v; fi", utils.ShellQuote(path), utils.ShellQuote(path)),
		fmt.Sprintf("chmod 777 %v", utils.ShellQuote(path)),
	}
}
