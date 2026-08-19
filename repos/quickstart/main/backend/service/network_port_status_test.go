package service

import (
	"context"

	"github.com/istoreos/quickstart/backend/models"
)

type fakeNetworkPortStatusReader struct {
	ports []*models.NetworkPortInfo
	err   error
}

func (reader *fakeNetworkPortStatusReader) Read(ctx context.Context) ([]*models.NetworkPortInfo, error) {
	return reader.ports, reader.err
}
