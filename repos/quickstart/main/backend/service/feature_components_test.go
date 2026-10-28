package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/http/httptest"
	"os"
	"os/exec"
	"reflect"
	"testing"

	"github.com/istoreos/quickstart/backend/models"
)

func TestSharedFeatureComponentContract(t *testing.T) {
	raw, err := os.ReadFile("../../docs/contracts/feature-components.json")
	if err != nil {
		t.Fatal(err)
	}
	var expected models.FeatureComponentsResult
	if err = json.Unmarshal(raw, &expected); err != nil {
		t.Fatal(err)
	}
	store := &catalogStore{statuses: map[string]*models.Capability{}}
	for _, item := range expected.Components {
		store.statuses[item.CapabilityKey] = item.Status
	}
	actual := NewCapabilityActionModule(store).Components(context.Background(), expected.CurrentProvider).Result
	if !reflect.DeepEqual(actual, &expected) {
		t.Fatalf("shared fixture drift: %+v", actual)
	}
}

func TestComponentPackageMetadataSupportsBothManagersAndDoesNotHideReadErrors(t *testing.T) {
	for _, suffix := range []string{"/usr/lib/opkg/info/luci-app-eqos.control", "/lib/apk/packages/luci-app-eqos.list"} {
		installed, err := componentPackageInstalled("luci-app-eqos", func(path string) (os.FileInfo, error) {
			if path == suffix {
				return nil, nil
			}
			return nil, os.ErrNotExist
		})
		if !installed || err != nil {
			t.Fatalf("metadata %s: %v %v", suffix, installed, err)
		}
	}
	installed, err := componentPackageInstalled("luci-app-eqos", func(string) (os.FileInfo, error) { return nil, os.ErrPermission })
	if installed || !errors.Is(err, os.ErrPermission) {
		t.Fatal("unreadable metadata became not installed")
	}
}

type catalogStore struct {
	fakeCapabilityActionStore
	statuses map[string]*models.Capability
}

func (store *catalogStore) Read(_ context.Context, key string) (*models.Capability, error) {
	status := store.statuses[key]
	if status == nil {
		return nil, errors.New("unavailable")
	}
	copy := *status
	return &copy, nil
}

func TestComponentsKeepNativeIndependentFromWorkingEqos(t *testing.T) {
	store := &catalogStore{statuses: map[string]*models.Capability{
		"device_speed_limit": {State: "not_installed"}, "compat_speed_limit": {State: "available"}, "floating_gateway": {State: "disabled"},
	}}
	store.available = capabilityInstallRequiredFreeBytes
	module := NewCapabilityActionModule(store)
	result := module.Components(context.Background(), "eqos").Result
	if result.Components[0].Selected || result.Components[0].Status.State != "not_installed" || !result.Components[1].Selected {
		t.Fatalf("wrong independent states: %+v", result.Components)
	}
	plan, err := module.Plan(context.Background(), &models.CapabilityActionRequest{CapabilityKey: "device_speed_limit", Action: "install"})
	if err != nil || !plan.Result.Plan.CanApply || plan.Result.Plan.Target != "quickstart-netpolicy" {
		t.Fatalf("native install blocked by eqos: %+v %v", plan, err)
	}
	if result.CurrentProvider != "eqos" || len(store.installs) != 0 {
		t.Fatal("reading/planning changed provider or installed")
	}
	delete(store.statuses, "floating_gateway")
	if got := module.Components(context.Background(), "eqos").Result.Components[2].Status.State; got != "error" {
		t.Fatalf("missing read became %s", got)
	}
}

func TestNativeComponentSeparatesStoppedFromRunningButUnready(t *testing.T) {
	for _, test := range []struct {
		name             string
		installed, ready bool
		reason           string
		running          bool
		want             models.CapabilityState
	}{
		{"absent", false, false, "dependency_not_installed", false, "not_installed"},
		{"stopped", true, false, "engine_unavailable", false, "disabled"},
		{"running not ready", true, false, "engine_unavailable", true, "error"},
		{"incompatible", true, false, "interface_not_supported", true, "unsupported"},
		{"ready", true, true, "", true, "available"},
	} {
		t.Run(test.name, func(t *testing.T) {
			probe := func(context.Context) (bool, bool, string) { return test.installed, test.ready, test.reason }
			run := func(_ context.Context, name string, args ...string) ([]byte, error) {
				if name != "/etc/init.d/quickstart-netpolicy" || len(args) != 1 || args[0] != "running" {
					t.Fatal("write in component read")
				}
				if test.running {
					return nil, nil
				}
				return nil, exec.Command("sh", "-c", "exit 1").Run()
			}
			got, err := nativeComponentCapability(context.Background(), probe, run)
			if err != nil || got.State != test.want {
				t.Fatalf("got %+v %v", got, err)
			}
		})
	}
}

func TestPendingActionRejectsDuplicateAndClearsOnlyAfterObservation(t *testing.T) {
	store := &catalogStore{statuses: map[string]*models.Capability{"device_speed_limit": {State: "not_installed"}}}
	module := NewCapabilityActionModule(store)
	module.operation("device_speed_limit", &componentOperation{state: "pending", action: "install"})
	response, err := module.Apply(context.Background(), &models.CapabilityActionRequest{CapabilityKey: "device_speed_limit", Action: "install", Confirm: true, ExpectedState: "not_installed"})
	if err != nil || response.Result.Error == nil || response.Result.Error.Code != "component_pending" || len(store.installs) != 0 {
		t.Fatalf("duplicate queued: %+v %v", response, err)
	}
	if module.Components(context.Background(), "eqos").Result.Components[0].Operation != "pending" {
		t.Fatal("unknown result cleared")
	}
	store.statuses["device_speed_limit"] = &models.Capability{State: "disabled"}
	if module.Components(context.Background(), "eqos").Result.Components[0].Operation != "" {
		t.Fatal("confirmed installation did not settle")
	}
	module.mu.Lock()
	defer module.mu.Unlock()
	response, err = module.Apply(context.Background(), &models.CapabilityActionRequest{CapabilityKey: "device_speed_limit", Action: "enable", Confirm: true})
	if err != nil || response.Result.Error.Code != "component_busy" {
		t.Fatal("concurrent action was queued")
	}
}

func TestComponentInstallerUsesSameWrapperForSourcesAndInstall(t *testing.T) {
	var calls []string
	store := &systemCapabilityActionStore{run: func(_ context.Context, name string, args ...string) ([]byte, error) {
		calls = append(calls, name+" "+args[0])
		return nil, nil
	}}
	if err := store.Install(context.Background(), "quickstart-netpolicy"); err != nil {
		t.Fatal(err)
	}
	if len(calls) != 2 || calls[0] != "is-opkg update" || calls[1] != "is-opkg install" {
		t.Fatalf("mixed package tools: %v", calls)
	}
}

func TestComponentHTTPRequiresValidatedRootRatherThanNonemptyHeader(t *testing.T) {
	request := httptest.NewRequest("GET", "http://localhost/", nil)
	request.Header.Set("X-Forwarded-Sid", "spoofed")
	backend := &ServiceBackend{}
	list, _ := backend.GetFeatureComponentsV2(context.Background(), request)
	plan, _ := backend.PostCapabilityActionPlanV2(context.Background(), request)
	apply, _ := backend.PostCapabilityActionApplyV2(context.Background(), request)
	if list.Success != -1001 || plan.Success != -1001 || apply.Success != -1001 {
		t.Fatal("unvalidated session accepted")
	}
}
