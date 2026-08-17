package service

import (
	"context"

	"github.com/istoreos/quickstart/backend/models"
	"github.com/istoreos/quickstart/backend/modules/network/homebox"
)

type homeBoxEnableFacade interface {
	Enable(ctx context.Context) (*models.NetworkHomeBoxEnableResponse, error)
}

var newHomeBoxEnableService = func() homeBoxEnableFacade {
	return homebox.NewDefaultHomeBoxEnableService()
}
