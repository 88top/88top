package server

import (
	"github.com/julienschmidt/httprouter"
	"github.com/istoreos/quickstart/backend/modules/quickstart"
	"github.com/istoreos/quickstart/backend/service"
)

var _ quickstart.Backend = (*service.ServiceBackend)(nil)

func registerQuickstartRoutes(router *httprouter.Router, serviceBackend *service.ServiceBackend) {
	quickstart.RegisterRoutes(router, serviceBackend)
}
