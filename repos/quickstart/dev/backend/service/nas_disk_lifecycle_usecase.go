package service

import (
	"context"

	"github.com/istoreos/quickstart/backend/models"
	disklifecycle "github.com/istoreos/quickstart/backend/modules/nas/disklifecycle"
)

type NasDiskLifecycleService = disklifecycle.Service

type nasDiskLifecycleFacade interface {
	MountPartition(ctx context.Context, input NasDiskPartitionMountInput) (*models.PartitionInfo, error)
	GenerateMountPoint(ctx context.Context, path string) (string, error)
	FormatByDevicePath(ctx context.Context, input NasDiskFormatByDevicePathInput) (*models.PartitionInfo, error)
	InitDisk(ctx context.Context, input NasDiskInitInput) (*models.NasDiskInfo, error)
	InitDiskRest(ctx context.Context, input NasDiskInitRestInput) (*models.NasDiskInfo, error)
}

var newNasDiskLifecycleService = func() nasDiskLifecycleFacade {
	return NewDefaultNasDiskLifecycleService()
}

func NewDefaultNasDiskLifecycleService() *NasDiskLifecycleService {
	return disklifecycle.NewService(
		newDefaultNasDiskSnapshotReader(),
		newDefaultNasDiskCommandStore(),
		newDefaultNasDiskMountPointGenerator(),
	)
}
