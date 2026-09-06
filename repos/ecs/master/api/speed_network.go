package api

import (
	"strings"

	"github.com/oneclickvirt/ecs/utils"
	speedmodel "github.com/oneclickvirt/speedtest/model"
)

// speedNetworkForPreCheck chooses the family represented by a speed report.
// Dual-stack reports intentionally prefer IPv4: the historical Fusion Monster
// speed profile is an IPv4 measurement unless the host is IPv6-only.
func speedNetworkForPreCheck(preCheck utils.NetCheckResult) speedmodel.Network {
	switch strings.ToLower(strings.TrimSpace(preCheck.StackType)) {
	case "dualstack", "ipv4":
		return speedmodel.NetworkIPv4
	case "ipv6":
		return speedmodel.NetworkIPv6
	}
	if preCheck.HasIPv4 {
		return speedmodel.NetworkIPv4
	}
	if preCheck.HasIPv6 {
		return speedmodel.NetworkIPv6
	}
	return speedmodel.NetworkAuto
}

func speedNetworkForComponentInputs(inputs componentInputs) speedmodel.Network {
	if inputs.SpeedNetwork != speedmodel.NetworkAuto {
		return inputs.SpeedNetwork
	}
	if strings.TrimSpace(inputs.PublicIPv4) != "" {
		return speedmodel.NetworkIPv4
	}
	if strings.TrimSpace(inputs.PublicIPv6) != "" {
		return speedmodel.NetworkIPv6
	}
	return speedmodel.NetworkAuto
}
