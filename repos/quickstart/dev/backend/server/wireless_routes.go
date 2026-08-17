package server

import (
	"github.com/julienschmidt/httprouter"
	"github.com/istoreos/quickstart/backend/modules/wireless"
	"github.com/istoreos/quickstart/backend/service"
)

var _ wireless.Backend = (*service.ServiceBackend)(nil)

func registerWirelessRoutes(router *httprouter.Router, serviceBackend *service.ServiceBackend) {
	wireless.RegisterRoutes(router, serviceBackend)
}
