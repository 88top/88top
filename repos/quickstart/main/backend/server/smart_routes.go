package server

import (
	"github.com/julienschmidt/httprouter"
	"github.com/istoreos/quickstart/backend/modules/smart"
	"github.com/istoreos/quickstart/backend/service"
)

var _ smart.Backend = (*service.ServiceBackend)(nil)

func registerSmartRoutes(router *httprouter.Router, serviceBackend *service.ServiceBackend) {
	smart.RegisterRoutes(router, serviceBackend)
}
