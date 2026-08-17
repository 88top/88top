package service

import (
	"context"

	platformuci "github.com/istoreos/quickstart/backend/internal/platform/uci"
	"github.com/istoreos/quickstart/backend/models"
	"github.com/istoreos/quickstart/backend/modules/system/modulesettings"
	"github.com/istoreos/quickstart/backend/utils"
)

type systemModuleSettingsFacade interface {
	Get(ctx context.Context) (*models.SystemModuleSettingsResponseResult, error)
	Set(ctx context.Context, req models.SystemModuleSettingsRequest) (*models.SDKNormalResponse, error)
}

var newSystemModuleSettingsService = func() systemModuleSettingsFacade {
	return modulesettings.NewService(defaultSystemModuleSettingsStore{})
}

type defaultSystemModuleSettingsStore struct{}

func (store defaultSystemModuleSettingsStore) ReadDisabledDisplayModules(ctx context.Context) ([]string, error) {
	return platformuci.ListOption("quickstart", "modules", "module"), nil
}

func (store defaultSystemModuleSettingsStore) HasDisabledDisplaySection(ctx context.Context) bool {
	return haveUciSection("quickstart", "disabledisplay", "modules")
}

func (store defaultSystemModuleSettingsStore) ApplyCommands(ctx context.Context, commands []string) error {
	return utils.UCIBatchRun(ctx, commands, "", 0)
}
