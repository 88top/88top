package api

import (
	"testing"
	"time"
)

func TestApplyOptionsValidatesConfig(t *testing.T) {
	cfg := NewDefaultConfig()

	ApplyOptions(cfg,
		WithLanguage("EN"),
		WithSpeedTestNum(0),
		WithNt3Location("all"),
		WithUnlockTestIPVersion("IPV6"),
		WithTCPTextFormat("FULL"),
		WithPingSortOrder("NAME"),
		WithPingScope("CHINA"),
		WithTCPSortOrder("LATENCY"),
		WithDNSMode("DOT"),
		nil,
	)

	if cfg.Language != "en" {
		t.Fatalf("Language = %q, want en", cfg.Language)
	}
	if cfg.SpNum != 2 {
		t.Fatalf("SpNum = %d, want default 2", cfg.SpNum)
	}
	if cfg.Nt3Location != "ALL" {
		t.Fatalf("Nt3Location = %q, want ALL", cfg.Nt3Location)
	}
	if cfg.UnlockTestIPVersion != "ipv6" {
		t.Fatalf("UnlockTestIPVersion = %q, want ipv6", cfg.UnlockTestIPVersion)
	}
	if cfg.TCPTextFormat != "full" {
		t.Fatalf("TCPTextFormat = %q, want full", cfg.TCPTextFormat)
	}
	if cfg.PingSortOrder != "name" || cfg.PingScope != "international" || cfg.TCPSortOrder != "latency" || cfg.DNSMode != "dot" {
		t.Fatalf("network ordering options were not normalized: ping=%q scope=%q tcp=%q", cfg.PingSortOrder, cfg.PingScope, cfg.TCPSortOrder)
	}
}

func TestApplyOptionsAllowsNilConfig(t *testing.T) {
	if ApplyOptions(nil, WithLanguage("en")) != nil {
		t.Fatalf("nil config should stay nil")
	}
}

func TestWithFullTestPresetUsesMenuContract(t *testing.T) {
	cfg := NewDefaultConfig()
	ApplyOptions(cfg, WithFullTestPreset(true))

	if cfg.Choice != "1" || !cfg.DiskMultiCheck || !cfg.DeepMode || cfg.DeepBurnDuration != 20*time.Second {
		t.Fatalf("API full preset did not enable deep hardware defaults: %+v", cfg)
	}
	if !cfg.PingTestStatus || cfg.TCPProbeStatus || !cfg.UnlockTestShowIP || !cfg.SpeedTestStatus {
		t.Fatalf("API full preset did not enable network enhancements: %+v", cfg)
	}
}

func TestWithFullConcurrentTestPresetUsesOptionTwoContract(t *testing.T) {
	cfg := NewDefaultConfig()
	ApplyOptions(cfg, WithFullConcurrentTestPreset(true))

	if cfg.Choice != "2" {
		t.Fatalf("full concurrent preset choice = %q, want 2", cfg.Choice)
	}
	if !cfg.BasicStatus || !cfg.CpuTestStatus || !cfg.MemoryTestStatus || !cfg.DiskTestStatus || !cfg.SpeedTestStatus {
		t.Fatalf("full concurrent preset did not retain full-suite coverage: %+v", cfg)
	}
	if !cfg.UtTestStatus || !cfg.SecurityTestStatus || !cfg.EmailTestStatus || !cfg.BacktraceStatus || !cfg.Nt3Status {
		t.Fatalf("full concurrent preset did not enable complete network coverage: %+v", cfg)
	}
}
