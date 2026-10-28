package service

import (
	"context"
	"net/http"

	"github.com/istoreos/quickstart/backend/models"
	appmetadata "github.com/istoreos/quickstart/backend/modules/app/metadata"
	"os"
	"path/filepath"
	"strings"
)

func (backend *ServiceBackend) PostAppCheck(ctx context.Context, r *http.Request) (*models.AppCheckResponse, error) {
	return AppCheck(ctx, r)
}

func (backend *ServiceBackend) CheckApp(ctx context.Context, req models.AppCheckRequest) (*models.AppCheckResponse, error) {
	return AppCheckValue(ctx, req)
}

func (backend *ServiceBackend) PostAppInstall(ctx context.Context, r *http.Request) (*models.SDKNormalResponse, error) {
	return AppInstall(ctx, r)
}

func (backend *ServiceBackend) InstallAppPackage(ctx context.Context, req models.AppInstallRequest) (*models.SDKNormalResponse, error) {
	return AppInstallValue(ctx, req)
}

func (backend *ServiceBackend) AppInstalledList(ctx context.Context, r *http.Request) (models.AppInstalledListResponse, error) {
	return AppInstalledList(ctx, r)
}

func (backend *ServiceBackend) ListInstalledApps(ctx context.Context) (models.AppInstalledListResponse, error) {
	return AppInstalledListValue(ctx)
}

func (backend *ServiceBackend) ListInstalledAppsStrict(ctx context.Context) (models.AppInstalledListResponse, error) {
	const root = "/tmp/run/istore-meta/meta"
	if _, err := os.Stat(root); err != nil {
		return nil, err
	}
	return appmetadata.NewService(strictAppMetadataStore{}).ListStrict(root)
}

type strictAppMetadataStore struct{ appMetadataStore }

func (strictAppMetadataStore) Glob(pattern string) ([]string, error) {
	root := filepath.Dir(pattern)
	entries, err := os.ReadDir(root)
	if err != nil {
		return nil, err
	}
	paths := []string{}
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".json") {
			paths = append(paths, filepath.Join(root, entry.Name()))
		}
	}
	return paths, nil
}
