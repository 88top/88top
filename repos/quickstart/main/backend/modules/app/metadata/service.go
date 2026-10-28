package metadata

import (
	"encoding/json"
	"errors"
	"regexp"
	"strings"

	"github.com/istoreos/quickstart/backend/models"
)

type FileInfo struct {
	ModTimeUnix int64
}

type Store interface {
	Glob(pattern string) ([]string, error)
	Stat(path string) (FileInfo, error)
	ReadFile(path string) ([]byte, error)
}

type Service struct {
	store Store
}

var catalogueName = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_.+-]{0,127}$`)

func NewService(store Store) *Service {
	return &Service{store: store}
}

func (service *Service) List(root string) ([]*models.AppInstalled, error) {
	return service.list(root, false)
}
func (service *Service) ListStrict(root string) ([]*models.AppInstalled, error) {
	return service.list(root, true)
}
func (service *Service) list(root string, strict bool) ([]*models.AppInstalled, error) {
	globStr := strings.TrimSuffix(root, "/") + "/**.json"
	apps, err := service.store.Glob(globStr)
	if err != nil {
		return nil, err
	}
	modelApps := make([]*models.AppInstalled, 0, len(apps))
	for _, app := range apps {
		fi, err := service.store.Stat(app)
		if err != nil {
			if strict {
				return nil, errors.New("application metadata unavailable")
			}
			continue
		}
		b, err := service.store.ReadFile(app)
		if err != nil {
			if strict {
				return nil, errors.New("application metadata unavailable")
			}
			continue
		}
		modelApp := &models.AppInstalled{}
		err = json.Unmarshal(b, modelApp)
		if err != nil {
			if strict {
				return nil, errors.New("application metadata unavailable")
			}
			continue
		}
		if strict && !catalogueName.MatchString(modelApp.Name) {
			return nil, errors.New("application metadata unavailable")
		}
		modelApp.Time = fi.ModTimeUnix
		modelApps = append(modelApps, modelApp)
	}
	return modelApps, nil
}
