package server

import (
	"github.com/julienschmidt/httprouter"
	"github.com/istoreos/quickstart/backend/modules/network"
	"github.com/istoreos/quickstart/backend/service"
)

var _ network.Backend = (*service.ServiceBackend)(nil)

func registerNetworkRoutes(router *httprouter.Router, serviceBackend *service.ServiceBackend) {
	network.RegisterRoutes(router, serviceBackend)
}
