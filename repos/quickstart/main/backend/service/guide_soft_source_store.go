package service

import (
	"context"
	"errors"
	"fmt"
	"io/ioutil"
	"net/url"
	"os"
	"regexp"
	"strings"

	"github.com/istoreos/quickstart/backend/models"
)

type GuideSoftSourceReader interface {
	ListSources(ctx context.Context) ([]*models.GuideSoftSourceInfo, error)
	ReadCurrentSource(ctx context.Context) (*models.GuideSoftSourceInfo, error)
}

type GuideSoftSourceWriter interface {
	ReplaceSource(ctx context.Context, source models.GuideSoftSourceInfo) error
}

var readGuideSoftSourceFile = ioutil.ReadFile
var writeGuideSoftSourceFile = ioutil.WriteFile
var statGuideSoftSourceFile = os.Stat

type defaultGuideSoftSourceReader struct{}

func newDefaultGuideSoftSourceReader() *defaultGuideSoftSourceReader {
	return &defaultGuideSoftSourceReader{}
}

func (reader *defaultGuideSoftSourceReader) ListSources(ctx context.Context) ([]*models.GuideSoftSourceInfo, error) {
	_ = ctx
	list := make([]*models.GuideSoftSourceInfo, 0, len(guideSoftSourceIdentities))
	for index, identity := range guideSoftSourceIdentities {
		source := buildGuideSoftSourceByIndex(identity, index)
		list = append(list, &source)
	}
	return list, nil
}

func (reader *defaultGuideSoftSourceReader) ReadCurrentSource(ctx context.Context) (*models.GuideSoftSourceInfo, error) {
	_ = ctx
	feedURL, err := readGuideSoftSourceFeedURL("/etc/opkg/distfeeds.conf")
	if err != nil {
		return nil, err
	}
	parsed, err := url.Parse(feedURL)
	if err != nil {
		return nil, errors.New("解析base软件源信息失败")
	}

	normalizedURL := fmt.Sprintf("%v://%v/openwrt/", parsed.Scheme, parsed.Host)
	if strings.Contains(parsed.Host, "openwrt") {
		normalizedURL = fmt.Sprintf("%v://%v/", parsed.Scheme, parsed.Host)
	}
	source := resolveGuideSoftSourceByURL(normalizedURL)
	return &source, nil
}

func readGuideSoftSourceFeedURL(path string) (string, error) {
	if canAccessPath("/etc/apk/repositories.d/distfeeds.list") {
		buf, err := readGuideSoftSourceFile("/etc/apk/repositories.d/distfeeds.list")
		if err != nil {
			return "", err
		}
		return getApkDistFeedUrlByContent(string(buf))
	} else {
		buf, err := readGuideSoftSourceFile("/etc/opkg/distfeeds.conf")
		if err != nil {
			return "", err
		}
		return getOpkgDistFeedUrlByContent(string(buf))
	}
}

func getApkDistFeedUrlByContent(content string) (string, error) {
	found := matchStringOnce(content, `(?m)^(https?:\/\/[^\/]*\/(openwrt\/)?).*\/base\/packages\.adb$`)
	if found == nil {
		return "", errors.New("apk feed not found")
	}
	return found[1], nil
}

func getOpkgDistFeedUrlByContent(content string) (string, error) {
	found := matchStringOnce(content, `_base\s+(https?:\/\/[^\/]*\/(openwrt\/)?)`)
	if found == nil {
		return "", errors.New("feed not found")
	}
	return found[1], nil
}

type defaultGuideSoftSourceWriter struct {
	sourcePath string
	targetPath string
}

func newDefaultGuideSoftSourceWriter() *defaultGuideSoftSourceWriter {
	if canAccessPath("/etc/apk/repositories.d/distfeeds.list") {
		return &defaultGuideSoftSourceWriter{
			sourcePath: "/rom/etc/apk/repositories.d/distfeeds.list",
			targetPath: "/etc/apk/repositories.d/distfeeds.list",
		}
	} else {
		return &defaultGuideSoftSourceWriter{
			sourcePath: "/rom/etc/opkg/distfeeds.conf",
			targetPath: "/etc/opkg/distfeeds.conf",
		}
	}
}

func (writer *defaultGuideSoftSourceWriter) ReplaceSource(ctx context.Context, source models.GuideSoftSourceInfo) error {
	_ = ctx
	return replaceGuideSoftSource(source.URL, writer.sourcePath, writer.targetPath)
}

func replaceGuideSoftSource(sourceURL, sourceFile, targetFile string) error {
	data, err := readGuideSoftSourceFile(sourceFile)
	if err != nil {
		data, err = readGuideSoftSourceFile(targetFile)
		if err != nil {
			return err
		}
	}
	urlRegex := regexp.MustCompile(`https?:\/\/[^\/]*\/(openwrt\/)?`)
	newFeeds := urlRegex.ReplaceAllString(string(data), sourceURL)

	fileMode := os.FileMode(0644)
	if fi, err := statGuideSoftSourceFile(targetFile); err == nil {
		fileMode = fi.Mode()
	}
	return writeGuideSoftSourceFile(targetFile, []byte(newFeeds), fileMode)
}
