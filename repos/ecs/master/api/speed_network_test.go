package api

import (
	"testing"

	"github.com/oneclickvirt/ecs/utils"
	speedmodel "github.com/oneclickvirt/speedtest/model"
)

func TestSpeedNetworkForPreCheckPrefersIPv4OnDualStackHosts(t *testing.T) {
	tests := []struct {
		name     string
		preCheck utils.NetCheckResult
		want     speedmodel.Network
	}{
		{name: "dual stack", preCheck: utils.NetCheckResult{StackType: "DualStack", HasIPv4: true, HasIPv6: true}, want: speedmodel.NetworkIPv4},
		{name: "IPv4 only", preCheck: utils.NetCheckResult{StackType: "IPv4", HasIPv4: true}, want: speedmodel.NetworkIPv4},
		{name: "IPv6 only", preCheck: utils.NetCheckResult{StackType: "IPv6", HasIPv6: true}, want: speedmodel.NetworkIPv6},
		{name: "fallback IPv4", preCheck: utils.NetCheckResult{HasIPv4: true, HasIPv6: true}, want: speedmodel.NetworkIPv4},
		{name: "fallback IPv6", preCheck: utils.NetCheckResult{HasIPv6: true}, want: speedmodel.NetworkIPv6},
		{name: "unknown", preCheck: utils.NetCheckResult{}, want: speedmodel.NetworkAuto},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := speedNetworkForPreCheck(test.preCheck); got != test.want {
				t.Fatalf("speedNetworkForPreCheck(%+v) = %q, want %q", test.preCheck, got, test.want)
			}
		})
	}
}

func TestSpeedNetworkForComponentInputsUsesPublicIdentity(t *testing.T) {
	if got := speedNetworkForComponentInputs(componentInputs{PublicIPv4: "198.51.100.10", PublicIPv6: "2001:db8::10"}); got != speedmodel.NetworkIPv4 {
		t.Fatalf("dual identity network = %q, want IPv4", got)
	}
	if got := speedNetworkForComponentInputs(componentInputs{PublicIPv6: "2001:db8::10"}); got != speedmodel.NetworkIPv6 {
		t.Fatalf("IPv6 identity network = %q, want IPv6", got)
	}
	if got := speedNetworkForComponentInputs(componentInputs{SpeedNetwork: speedmodel.NetworkIPv4, PublicIPv6: "2001:db8::10"}); got != speedmodel.NetworkIPv4 {
		t.Fatalf("explicit network = %q, want IPv4", got)
	}
}
