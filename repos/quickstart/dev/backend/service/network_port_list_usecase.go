package service

import (
	"context"

	"github.com/istoreos/quickstart/backend/models"
	"github.com/istoreos/quickstart/backend/modules/network/portlist"
)

type networkPortListFacade interface {
	GetPortList(ctx context.Context) (*models.NetworkPortListResponse, error)
}

var newNetworkPortListService = func() networkPortListFacade {
	return portlist.NewService(newDefaultNetworkPortStatusReader(), newDefaultNetworkPortMembershipReader())
}
