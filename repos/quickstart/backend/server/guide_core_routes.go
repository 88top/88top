package server

import (
	"github.com/julienschmidt/httprouter"
	"github.com/istoreos/quickstart/backend/modules/guidecore"
	"github.com/istoreos/quickstart/backend/service"
)

var _ guidecore.Backend = (*service.ServiceBackend)(nil)

func registerGuideCoreRoutes(router *httprouter.Router, serviceBackend *service.ServiceBackend) {
	guidecore.RegisterRoutes(router, serviceBackend)
}
