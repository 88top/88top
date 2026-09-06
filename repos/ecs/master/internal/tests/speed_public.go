//go:build ecs_public

package tests

import (
	"context"
	"fmt"
	"os"
	"runtime"
	"strings"

	"github.com/oneclickvirt/speedtest/model"
	"github.com/oneclickvirt/speedtest/sp"
)

func ShowHead(language string) {
	defer func() {
		if recover() != nil {
			fmt.Fprintln(os.Stderr, "[WARN] speedtest header unavailable")
		}
	}()
	sp.ShowHead(language)
}

func NearbySP() {
	NearbySPWithNetwork("")
}

func NearbySPWithNetwork(network string) {
	defer func() {
		if recover() != nil {
			fmt.Fprintln(os.Stderr, "[WARN] nearby speedtest unavailable")
		}
	}()
	network = normalizeSpeedNetwork(network)
	if runtime.GOOS == "windows" || sp.OfficialAvailableTest() != nil {
		sp.NearbySpeedTestWithNetwork(network)
		return
	}
	sp.OfficialNearbySpeedTestWithNetwork(network)
}

// CustomSP keeps public builds on the established public speedtest sources.
func CustomSP(platform, operator string, num int, language string) {
	CustomSPWithNetwork(platform, operator, num, language, "")
}

func CustomSPWithNetwork(platform, operator string, num int, language, network string) {
	defer func() {
		if recover() != nil {
			fmt.Fprintln(os.Stderr, "[WARN] custom speedtest unavailable")
		}
	}()
	network = normalizeSpeedNetwork(network)

	var url, parseType string
	switch strings.ToLower(platform) {
	case "cn":
		switch strings.ToLower(operator) {
		case "cmcc":
			url = model.CnCMCC
		case "cu":
			url = model.CnCU
		case "ct":
			url = model.CnCT
		case "hk":
			url = model.CnHK
		case "tw":
			url = model.CnTW
		case "jp":
			url = model.CnJP
		case "sg":
			url = model.CnSG
		}
		parseType = "url"
	case "net":
		switch strings.ToLower(operator) {
		case "cmcc":
			url = model.NetCMCC
		case "cu":
			url = model.NetCU
		case "ct":
			url = model.NetCT
		case "hk":
			url = model.NetHK
		case "tw":
			url = model.NetTW
		case "jp":
			url = model.NetJP
		case "sg":
			url = model.NetSG
		case "global", "other":
			url = model.NetGlobal
		}
		parseType = "id"
	}
	if runtime.GOOS == "windows" || sp.OfficialAvailableTest() != nil {
		sp.CustomSpeedTestWithNetwork(url, parseType, num, language, network)
		return
	}
	sp.OfficialCustomSpeedTestWithNetwork(url, parseType, num, language, network)
}

// PrivateSpeedPreloads is a no-op compatibility type for ecs_public builds,
// which intentionally do not link the managed private speed registry.
type PrivateSpeedPreloads struct{}

func StartPrivateSpeedPreloads(context.Context, []string, string) *PrivateSpeedPreloads {
	return &PrivateSpeedPreloads{}
}

func CustomSPWithNetworkAndPreloads(_ context.Context, platform, operator string, num int, language, network string, _ *PrivateSpeedPreloads) {
	CustomSPWithNetwork(platform, operator, num, language, network)
}
