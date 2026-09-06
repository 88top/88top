package tests

import "strings"

func normalizeSpeedNetwork(network string) string {
	switch strings.ToLower(strings.TrimSpace(network)) {
	case "tcp4", "ipv4", "4":
		return "tcp4"
	case "tcp6", "ipv6", "6":
		return "tcp6"
	default:
		return ""
	}
}
