package server

import (
	"github.com/julienschmidt/httprouter"
	"github.com/istoreos/quickstart/backend/modules/app"
	"github.com/istoreos/quickstart/backend/service"
)

var _ app.Backend = (*service.ServiceBackend)(nil)

func registerAppRoutes(router *httprouter.Router, serviceBackend *service.ServiceBackend) {
	app.RegisterRoutes(router, serviceBackend)
}
