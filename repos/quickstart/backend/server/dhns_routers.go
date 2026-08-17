package server

import (
	"github.com/julienschmidt/httprouter"
	"github.com/istoreos/quickstart/backend/modules/dhns"
	"github.com/istoreos/quickstart/backend/service"
)

var _ dhns.Backend = (*service.ServiceBackend)(nil)

func dhnsRouterInit(router *httprouter.Router, serviceBackend *service.ServiceBackend) *httprouter.Router {
	return dhns.RegisterRoutes(router, serviceBackend)
}
