package server

import (
	"github.com/julienschmidt/httprouter"
	"github.com/istoreos/quickstart/backend/modules/raid"
	"github.com/istoreos/quickstart/backend/service"
)

var _ raid.Backend = (*service.ServiceBackend)(nil)

func registerRaidRoutes(router *httprouter.Router, serviceBackend *service.ServiceBackend) {
	raid.RegisterRoutes(router, serviceBackend)
}
