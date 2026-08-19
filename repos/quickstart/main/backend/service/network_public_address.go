package service

import (
	"github.com/istoreos/quickstart/backend/models"
	"github.com/istoreos/quickstart/backend/modules/network/publicaddress"
)

type networkPublicAddressFacade interface {
	CheckPublicAddress(ipVersion string) (*models.NetworkCheckPublicNetResponse, error)
}

var newNetworkPublicAddressService = func() networkPublicAddressFacade {
	return publicaddress.NewService(newDefaultNetworkPublicAddressReader(), newDefaultNetworkPublicAddressClassifier())
}
