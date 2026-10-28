package interfacewrite

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/istoreos/quickstart/backend/models"
)

type Store interface {
	ReadSnapshot(ctx context.Context) (Snapshot, error)
	NormalizeDevices(name string, devices []string) []string
	ApplyPlan(ctx context.Context, plan CommandPlan) error
}

type Apply interface {
	Apply(ctx context.Context, configs []string) error
}

type Service struct {
	store Store
	apply Apply
}

func NewService(store Store, apply Apply) *Service {
	return &Service{store: store, apply: apply}
}

func (svc *Service) ApplyConfigSet(ctx context.Context, input Input) (*models.SDKNormalResponse, error) {
	snapshot, err := svc.store.ReadSnapshot(ctx)
	if err != nil {
		return nil, err
	}
	if len(input.Configs) == 0 {
		return nil, errors.New("missing interface configuration")
	}
	seen := make(map[string]bool)
	for _, cfg := range input.Configs {
		if cfg == nil || !interfaceName.MatchString(cfg.Name) || seen[cfg.Name] || !interfaceName.MatchString(cfg.Proto) {
			return nil, errors.New("invalid interface configuration")
		}
		seen[cfg.Name] = true
		for _, device := range cfg.Devices {
			if device == "" || strings.ContainsAny(device, "\x00\r\n") {
				return nil, errors.New("invalid network device")
			}
		}
	}

	plan := CommandPlan{
		DeleteCommands: BuildDeleteCommands(BuildDeletePlan(snapshot.Interfaces, input.Configs)),
	}

	for _, cfg := range input.Configs {
		if cfg == nil {
			continue
		}
		normalized := svc.store.NormalizeDevices(cfg.Name, cfg.Devices)
		bridged := len(cfg.Devices) > 1 || cfg.Name == "lan"
		deviceName := ""
		if bridged {
			deviceName = "br-" + cfg.Name
			plan.BridgeCommands = append(plan.BridgeCommands, BuildBridgePlan(cfg, normalized, snapshot.DeviceSections))
		} else if len(normalized) > 0 {
			deviceName = normalized[0]
		}

		plan.InterfaceCommands = append(plan.InterfaceCommands, BuildInterfacePlan(cfg, deviceName, bridged))
		if firewallCmds := BuildFirewallBindingPlan(cfg, snapshot.FirewallZones); len(firewallCmds) > 0 {
			plan.FirewallCommands = append(plan.FirewallCommands, firewallCmds)
		}
	}

	if err := svc.store.ApplyPlan(ctx, plan); err != nil {
		return nil, err
	}
	if err := svc.apply.Apply(ctx, []string{"firewall", "network"}); err != nil {
		return nil, err
	}

	success := models.ResponseSuccess(int64(0))
	return &models.SDKNormalResponse{Success: &success}, nil
}

var interfaceName = regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
