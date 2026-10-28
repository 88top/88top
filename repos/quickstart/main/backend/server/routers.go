package server

import (
	"net/http"

	"github.com/istoreos/quickstart/backend/modules/homeconfig"
	"github.com/istoreos/quickstart/backend/service"
	"github.com/julienschmidt/httprouter"
)

func RouterInit(serviceBackend *service.ServiceBackend) http.Handler {
	router := httprouter.New()

	registerNetworkRoutes(router, serviceBackend)
	registerSystemRoutes(router, serviceBackend)
	registerAppRoutes(router, serviceBackend)
	registerRaidRoutes(router, serviceBackend)
	registerSmartRoutes(router, serviceBackend)
	registerQuickstartRoutes(router, serviceBackend)
	registerHomeConfigRoutes(router)
	registerNasRoutes(router, serviceBackend)
	registerGuideCoreRoutes(router, serviceBackend)
	registerGuideStorageRoutes(router, serviceBackend)
	registerGuideDDNSRoutes(router, serviceBackend)
	registerShareRoutes(router, serviceBackend)
	registerWirelessRoutes(router, serviceBackend)
	router = lanControlRouterInit(router, serviceBackend)

	return secureHTTP(router, homeconfig.RootAuthorizer(homeconfig.LocalSession))
}

func UnixRouterInit(serviceBackend *service.ServiceBackend) http.Handler {
	router := httprouter.New()

	registerLCDRoutes(router, serviceBackend)
	dhnsRouterInit(router, serviceBackend)

	return router
}
