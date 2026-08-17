package server

import (
	"github.com/julienschmidt/httprouter"
	"github.com/istoreos/quickstart/backend/modules/lancontrol"
	"github.com/istoreos/quickstart/backend/service"
)

var _ lancontrol.Backend = (*service.ServiceBackend)(nil)

func lanControlRouterInit(router *httprouter.Router, serviceBackend *service.ServiceBackend) *httprouter.Router {
	lancontrol.RegisterRoutes(router, serviceBackend)
	return router
}
