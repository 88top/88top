package service

import (
	"context"

	"github.com/istoreos/quickstart/backend/modules/network/interfacewrite"
	"github.com/istoreos/quickstart/backend/utils"
)

var networkInterfaceWriteCommitAndApply = utils.UciCommitAndApply

type NetworkInterfaceConfigApply = interfacewrite.Apply

type defaultNetworkInterfaceConfigApply struct{}

func NewDefaultNetworkInterfaceConfigApply() NetworkInterfaceConfigApply {
	return &defaultNetworkInterfaceConfigApply{}
}

func (apply *defaultNetworkInterfaceConfigApply) Apply(ctx context.Context, configs []string) error {
	return networkInterfaceWriteCommitAndApply(ctx, configs)
}
