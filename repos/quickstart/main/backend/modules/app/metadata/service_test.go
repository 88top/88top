package metadata

import (
	"errors"
	"reflect"
	"testing"

	"github.com/istoreos/quickstart/backend/models"
)

type fakeStore struct {
	globErr error
	paths   []string
	stats   map[string]FileInfo
	statErr map[string]error
	files   map[string][]byte
	readErr map[string]error

	globPattern string
}

func (store *fakeStore) Glob(pattern string) ([]string, error) {
	store.globPattern = pattern
	return store.paths, store.globErr
}

func (store *fakeStore) Stat(path string) (FileInfo, error) {
	if err := store.statErr[path]; err != nil {
		return FileInfo{}, err
	}
	return store.stats[path], nil
}

func (store *fakeStore) ReadFile(path string) ([]byte, error) {
	if err := store.readErr[path]; err != nil {
		return nil, err
	}
	return store.files[path], nil
}

func TestServiceListParsesValidMetadataAndSkipsBadFiles(t *testing.T) {
	store := &fakeStore{
		paths: []string{
			"/meta/valid.json",
			"/meta/missing-stat.json",
			"/meta/missing-read.json",
			"/meta/invalid.json",
		},
		stats: map[string]FileInfo{
			"/meta/valid.json":        {ModTimeUnix: 123},
			"/meta/missing-read.json": {ModTimeUnix: 456},
			"/meta/invalid.json":      {ModTimeUnix: 789},
		},
		statErr: map[string]error{
			"/meta/missing-stat.json": errors.New("stat failed"),
		},
		files: map[string][]byte{
			"/meta/valid.json":   []byte(`{"name":"demo","title":"Demo","version":"1.0.0"}`),
			"/meta/invalid.json": []byte(`{invalid`),
		},
		readErr: map[string]error{
			"/meta/missing-read.json": errors.New("read failed"),
		},
	}
	service := NewService(store)

	got, err := service.List("/meta/")
	if err != nil {
		t.Fatalf("list metadata: %v", err)
	}
	want := []*models.AppInstalled{{
		Name:    "demo",
		Title:   "Demo",
		Version: "1.0.0",
		Time:    123,
	}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("unexpected metadata\nwant: %#v\n got: %#v", want, got)
	}
	if store.globPattern != "/meta/**.json" {
		t.Fatalf("unexpected glob pattern: %q", store.globPattern)
	}
}

func TestServiceListPropagatesGlobError(t *testing.T) {
	globErr := errors.New("glob failed")
	service := NewService(&fakeStore{globErr: globErr})

	if _, err := service.List("/meta"); !errors.Is(err, globErr) {
		t.Fatalf("expected glob error, got %v", err)
	}
}

func TestStrictCatalogueRejectsInvalidIdentityWithoutChangingLegacyList(t *testing.T) {
	for _, body := range []string{`null`, `{}`, `{"name":""}`, `{"name":"invalid/name"}`} {
		t.Run(body, func(t *testing.T) {
			store := &fakeStore{paths: []string{"/meta/app.json"}, files: map[string][]byte{"/meta/app.json": []byte(body)}}
			service := NewService(store)
			if _, err := service.ListStrict("/meta"); err == nil {
				t.Fatal("invalid metadata was reported as a complete catalogue")
			}
			if _, err := service.List("/meta"); err != nil {
				t.Fatal("legacy list compatibility changed")
			}
		})
	}
	if apps, err := NewService(&fakeStore{}).ListStrict("/meta"); err != nil || len(apps) != 0 {
		t.Fatal("genuine empty catalogue must remain successful")
	}
}
