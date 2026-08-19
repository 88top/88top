package service

import (
	"context"

	"github.com/istoreos/quickstart/backend/models"
	"github.com/istoreos/quickstart/backend/modules/network/interfacewrite"
)

type networkInterfaceConfigFacade interface {
	ApplyConfigSet(ctx context.Context, input NetworkInterfaceWriteInput) (*models.SDKNormalResponse, error)
}

var newNetworkInterfaceConfigService = func() networkInterfaceConfigFacade {
	return NewDefaultNetworkInterfaceConfigService()
}

func NewDefaultNetworkInterfaceConfigService() *interfacewrite.Service {
	return interfacewrite.NewService(NewDefaultNetworkInterfaceConfigStore(), NewDefaultNetworkInterfaceConfigApply())
}
