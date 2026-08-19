package service

import (
	"context"

	"github.com/istoreos/quickstart/backend/models"
	systempower "github.com/istoreos/quickstart/backend/modules/system/power"
	"github.com/istoreos/quickstart/backend/utils"
)

type systemPowerFacade interface {
	Reboot(ctx context.Context) (*models.SDKNormalResponse, error)
	PowerOff(ctx context.Context) (*models.SDKNormalResponse, error)
}

var newSystemPowerService = func() systemPowerFacade {
	return systempower.NewService(defaultSystemPowerStore{})
}

type defaultSystemPowerStore struct{}

func (store defaultSystemPowerStore) Run(ctx context.Context, commands []string) error {
	_, _, err := utils.BatchOutErr(ctx, commands, 0)
	return err
}
