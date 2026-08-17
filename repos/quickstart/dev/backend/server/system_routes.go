package server

import (
	"github.com/julienschmidt/httprouter"
	"github.com/istoreos/quickstart/backend/modules/system"
	"github.com/istoreos/quickstart/backend/service"
)

var _ system.Backend = (*service.ServiceBackend)(nil)

func registerSystemRoutes(router *httprouter.Router, serviceBackend *service.ServiceBackend) {
	system.RegisterRoutes(router, serviceBackend)
}
