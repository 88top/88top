//go:build !ecs_public

package api

import (
	"context"
	"errors"
	"strings"
	"time"

	privatepst "github.com/oneclickvirt/privatespeedtest/pst"
	privatetransfer "github.com/oneclickvirt/privatespeedtest/transfer"
	speedmodel "github.com/oneclickvirt/speedtest/model"
)

func hasPrivateComponentData() bool { return true }

func loadPrivateSpeedComponentData(ctx context.Context, offline bool) componentDataResult {
	return loadPrivateSpeedComponentDataWithNetwork(ctx, offline, speedmodel.NetworkAuto)
}

func loadPrivateSpeedComponentDataWithNetwork(ctx context.Context, offline bool, network speedmodel.Network) componentDataResult {
	var loaded privatepst.RegistryLoadResult
	var err error
	if offline {
		loaded, err = privatepst.LoadEmbeddedServerList()
	} else {
		loaded, err = privatepst.LoadServerListWithMetadataContextWithNetwork(ctx, privateSpeedNetwork(network))
	}
	if err != nil {
		return failedComponentData(ctx, privateDataFile, err)
	}
	file := stringMetadataFile(privateDataFile, loaded.Metadata.Schema, loaded.Metadata.GeneratedAt, loaded.Source, loaded.Fallback, loaded.Metadata.Count)
	return componentDataResult{file: file}
}

func loadTransferComponentData(ctx context.Context, offline bool) componentDataResult {
	var loaded privatetransfer.RegistryLoadResult
	var err error
	if offline {
		loaded, err = privatetransfer.LoadEmbeddedRegistry()
	} else {
		loaded, err = privatetransfer.LoadDefaultRegistry(ctx)
	}
	if err != nil {
		return failedComponentData(ctx, transferDataFile, err)
	}
	file := stringMetadataFile(transferDataFile, loaded.Metadata.Schema, loaded.Metadata.GeneratedAt, loaded.Source, loaded.Fallback, loaded.Metadata.Count)
	targets := make([]transferTargetInput, 0, len(loaded.Targets))
	for _, target := range loaded.Targets {
		targets = append(targets, transferTargetInput{
			ID: target.ID, Host: target.Host, PortFrom: target.PortFrom, PortTo: target.PortTo,
			Provider: target.Provider, Country: target.Country, City: target.City, Status: target.Status,
		})
	}
	return componentDataResult{file: file, apply: func(inputs *componentInputs) { inputs.TransferTargets = targets }}
}

func runPrivateSpeedBenchmarks(ctx context.Context, limit int) (any, int, []privateSpeedBenchmark) {
	return runPrivateSpeedBenchmarksWithNetwork(ctx, limit, speedmodel.NetworkAuto)
}

func runEmbeddedPrivateSpeedBenchmarks(ctx context.Context, limit int) (any, int, []privateSpeedBenchmark) {
	return runEmbeddedPrivateSpeedBenchmarksWithNetwork(ctx, limit, speedmodel.NetworkAuto)
}

func runInternationalPrivateSpeedBenchmarks(ctx context.Context, limit int) (any, int, []privateSpeedBenchmark) {
	return runInternationalPrivateSpeedBenchmarksWithNetwork(ctx, limit, speedmodel.NetworkAuto)
}

func runEmbeddedInternationalPrivateSpeedBenchmarks(ctx context.Context, limit int) (any, int, []privateSpeedBenchmark) {
	return runEmbeddedInternationalPrivateSpeedBenchmarksWithNetwork(ctx, limit, speedmodel.NetworkAuto)
}

func runPrivateSpeedBenchmarksWithNetwork(ctx context.Context, limit int, network speedmodel.Network) (any, int, []privateSpeedBenchmark) {
	return runPrivateSpeedBenchmarksWithLoaderAndNetwork(ctx, limit, func(ctx context.Context, network speedmodel.Network) (privatepst.RegistryLoadResult, error) {
		return privatepst.LoadServerListWithMetadataContextWithNetwork(ctx, privateSpeedNetwork(network))
	}, network)
}

func runEmbeddedPrivateSpeedBenchmarksWithNetwork(ctx context.Context, limit int, network speedmodel.Network) (any, int, []privateSpeedBenchmark) {
	return runPrivateSpeedBenchmarksWithLoaderAndNetwork(ctx, limit, func(context.Context, speedmodel.Network) (privatepst.RegistryLoadResult, error) {
		return privatepst.LoadEmbeddedServerList()
	}, network)
}

func runInternationalPrivateSpeedBenchmarksWithNetwork(ctx context.Context, limit int, network speedmodel.Network) (any, int, []privateSpeedBenchmark) {
	return runPrivateSpeedBenchmarksWithLoaderAndNetwork(ctx, limit, func(ctx context.Context, network speedmodel.Network) (privatepst.RegistryLoadResult, error) {
		loaded, err := privatepst.LoadServerListWithMetadataContextWithNetwork(ctx, privateSpeedNetwork(network))
		return filterInternationalPrivateRegistry(loaded), err
	}, network)
}

func runEmbeddedInternationalPrivateSpeedBenchmarksWithNetwork(ctx context.Context, limit int, network speedmodel.Network) (any, int, []privateSpeedBenchmark) {
	return runPrivateSpeedBenchmarksWithLoaderAndNetwork(ctx, limit, func(context.Context, speedmodel.Network) (privatepst.RegistryLoadResult, error) {
		loaded, err := privatepst.LoadEmbeddedServerList()
		return filterInternationalPrivateRegistry(loaded), err
	}, network)
}

func filterInternationalPrivateRegistry(loaded privatepst.RegistryLoadResult) privatepst.RegistryLoadResult {
	if loaded.List == nil {
		return loaded
	}
	copyList := *loaded.List
	copyList.Servers = make([]privatepst.ServerConfig, 0, len(loaded.List.Servers))
	for _, server := range loaded.List.Servers {
		if strings.TrimSpace(server.Country) != "" && !isMainlandChinaCountry(server.Country) {
			copyList.Servers = append(copyList.Servers, server)
		}
	}
	copyList.TotalServers = len(copyList.Servers)
	loaded.List = &copyList
	return loaded
}

func runPrivateSpeedBenchmarksWithLoader(ctx context.Context, limit int, loader func(context.Context) (privatepst.RegistryLoadResult, error)) (any, int, []privateSpeedBenchmark) {
	return runPrivateSpeedBenchmarksWithLoaderAndNetwork(ctx, limit, func(ctx context.Context, _ speedmodel.Network) (privatepst.RegistryLoadResult, error) {
		return loader(ctx)
	}, speedmodel.NetworkAuto)
}

func runPrivateSpeedBenchmarksWithLoaderAndNetwork(ctx context.Context, limit int, loader func(context.Context, speedmodel.Network) (privatepst.RegistryLoadResult, error), network speedmodel.Network) (any, int, []privateSpeedBenchmark) {
	if ctx == nil {
		ctx = context.Background()
	}
	if limit <= 0 {
		limit = 2
	}
	loaded, err := loader(ctx, network)
	if err != nil {
		return privatepst.RegistryReport{
			SchemaVersion: "privatespeedtest.registry/v1", Fallback: true,
			Availability: privatepst.ServerUnavailable, Servers: []privatepst.RegistryNode{}, Error: err.Error(),
		}, 0, nil
	}
	privateNetwork := privateSpeedNetwork(network)
	registry := privatepst.ResolveLoadedServerRegistryWithNetwork(ctx, loaded, limit, 2*time.Second, nil, privateNetwork)
	selected, benchmarks := runPrivateSpeedBenchmarksFromRegistry(ctx, limit, registry, func(ctx context.Context, node privatepst.RegistryNode, latencyInfo *privatepst.ServerWithLatencyInfo) privatepst.SpeedTestResult {
		return privatepst.RunSpeedTestContextWithNetwork(ctx, node.Server, false, false, 4, 5*time.Second, latencyInfo, false, privateNetwork)
	})
	return registry, selected, benchmarks
}

func privateSpeedNetwork(network speedmodel.Network) privatepst.Network {
	switch network {
	case speedmodel.NetworkIPv4:
		return privatepst.NetworkIPv4
	case speedmodel.NetworkIPv6:
		return privatepst.NetworkIPv6
	default:
		return privatepst.NetworkAuto
	}
}

type privateSpeedTestFunc func(context.Context, privatepst.RegistryNode, *privatepst.ServerWithLatencyInfo) privatepst.SpeedTestResult

func runPrivateSpeedBenchmarksFromRegistry(ctx context.Context, limit int, registry privatepst.RegistryReport, speedTest privateSpeedTestFunc) (int, []privateSpeedBenchmark) {
	if ctx == nil {
		ctx = context.Background()
	}
	attempts := make([]privatepst.RegistryNode, 0, len(registry.Selected)+len(registry.Standby))
	attempts = append(attempts, registry.Selected...)
	attempts = append(attempts, registry.Standby...)
	benchmarks := make([]privateSpeedBenchmark, 0, len(attempts))
	usable := 0
	for _, selected := range attempts {
		if usable >= limit {
			break
		}
		if err := ctx.Err(); err != nil {
			benchmarks = append(benchmarks, privateSpeedBenchmark{ID: selected.ID, Name: selected.Name, Source: "privatespeedtest", Status: speedContextStatus(err), Error: err.Error()})
			break
		}
		latency := time.Duration(selected.LatencyMS) * time.Millisecond
		latencyInfo := &privatepst.ServerWithLatencyInfo{
			Server: selected.Server, Latency: latency, MinLatency: latency, MaxLatency: latency,
			Availability: selected.Availability, ProbeMethod: selected.ProbeMethod, ProbeResults: selected.ProbeResults,
		}
		result := speedTest(ctx, selected, latencyInfo)
		status := "unavailable"
		switch {
		case errors.Is(ctx.Err(), context.Canceled):
			status = "canceled"
		case errors.Is(ctx.Err(), context.DeadlineExceeded):
			status = "timeout"
		case result.Success:
			status = "available"
		case result.DownloadMbps > 0 || result.UploadMbps > 0:
			status = "partial"
		}
		if result.DownloadMbps > 0 || result.UploadMbps > 0 {
			usable++
		}
		benchmarks = append(benchmarks, privateSpeedBenchmark{
			ID: selected.ID, Name: selected.Name, Source: "privatespeedtest", Status: status,
			LatencyMS: float64(result.PingLatency) / float64(time.Millisecond), DownloadMbps: result.DownloadMbps,
			UploadMbps: result.UploadMbps, DurationMS: result.Duration.Milliseconds(), Error: result.Error,
		})
	}
	return len(benchmarks), benchmarks
}
