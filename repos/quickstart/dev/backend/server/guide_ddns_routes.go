package server

import (
	"github.com/julienschmidt/httprouter"
	"github.com/istoreos/quickstart/backend/modules/guideddns"
	"github.com/istoreos/quickstart/backend/service"
)

var _ guideddns.Backend = (*service.ServiceBackend)(nil)

func registerGuideDDNSRoutes(router *httprouter.Router, serviceBackend *service.ServiceBackend) {
	guideddns.RegisterRoutes(router, serviceBackend)
}
