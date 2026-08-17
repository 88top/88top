package server

import (
	"github.com/julienschmidt/httprouter"
	"github.com/istoreos/quickstart/backend/modules/nas"
	"github.com/istoreos/quickstart/backend/service"
)

var _ nas.Backend = (*service.ServiceBackend)(nil)

func registerNasRoutes(router *httprouter.Router, serviceBackend *service.ServiceBackend) {
	nas.RegisterRoutes(router, serviceBackend)
}
