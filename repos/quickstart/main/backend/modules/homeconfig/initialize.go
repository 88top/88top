package homeconfig

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

// One authoritative default is compiled by Go and imported by the web client.
//
//go:embed defaults.json
var defaults []byte

type LegacySettings struct {
	Exists   bool     `json:"exists"`
	Disabled []string `json:"diableDisplay"`
}
type LegacyReader func() (LegacySettings, error)
type Repository interface {
	Read(string) (Snapshot, error)
	Save(string, string, []byte) (Snapshot, error)
	RestoreBackup(string, string) (Snapshot, error)
	RestoreDefaults(string, string) (Snapshot, error)
}
type InitializedStore struct {
	store  *Store
	legacy LegacyReader
}

func NewInitializedStore(store *Store, legacy LegacyReader) *InitializedStore {
	return &InitializedStore{store: store, legacy: legacy}
}
func (s *InitializedStore) Read(domain string) (Snapshot, error) {
	current, err := s.store.Read(domain)
	if err != nil || current.State != "missing" {
		return current, err
	}
	if s.legacy == nil {
		return Snapshot{}, errors.New("legacy reader unavailable")
	}
	legacy, err := s.legacy()
	if err != nil {
		return Snapshot{}, err
	}
	if legacy.Disabled == nil {
		legacy.Disabled = []string{}
	}
	raw, err := InitialValue(domain, legacy)
	if err != nil {
		return Snapshot{}, err
	}
	result, err := s.store.save(domain, "missing", raw, &legacy)
	if errors.Is(err, ErrConflict) {
		return s.store.Read(domain)
	}
	return result, err
}
func (s *InitializedStore) Save(domain, version string, raw []byte) (Snapshot, error) {
	if _, err := s.Read(domain); err != nil {
		return Snapshot{}, err
	}
	return s.store.Save(domain, version, raw)
}
func (s *InitializedStore) RestoreBackup(domain, token string) (Snapshot, error) {
	return s.store.RestoreBackup(domain, token)
}

func (s *InitializedStore) RestoreDefaults(domain, token string) (Snapshot, error) {
	return s.store.RestoreDefaults(domain, token)
}

func InitialValue(domain string, legacy LegacySettings) ([]byte, error) {
	var doc struct {
		Layout   Layout   `json:"layout"`
		Launcher Launcher `json:"launcher"`
	}
	if err := json.Unmarshal(defaults, &doc); err != nil {
		return nil, err
	}
	if domain == "launcher" {
		raw, _ := json.Marshal(doc.Launcher)
		return Canonical(domain, raw)
	}
	if domain != "layout" {
		return nil, ErrInvalid
	}
	if legacy.Exists {
		mapping := map[string]string{"networkFlow": "traffic", "networkConnection": "connection", "networkInterface": "networkInterface", "diskInfo": "storage", "storage": "sharing", "docker": "docker", "downloadService": "downloads", "remoteDomain": "remote", "systemInfo": "system"}
		hidden := map[string]bool{"devices": true}
		old := map[string]bool{}
		for _, key := range legacy.Disabled {
			old[key] = true
			if id := mapping[key]; id != "" {
				hidden[id] = true
			}
		}
		hidden["applications"] = old["quickActions"] && old["configModule"]
		rows := []Row{}
		for _, row := range doc.Layout.Rows {
			ids := []*string{}
			for _, column := range row.Columns {
				for _, id := range column.Cards {
					if id != nil && !hidden[*id] {
						ids = append(ids, id)
					}
				}
			}
			if len(ids) == 0 {
				continue
			}
			if row.Template != "left-big" || len(ids) != 3 {
				row.Template = map[int]string{1: "single", 2: "pair", 3: "triple"}[len(ids)]
				row.Columns = []Column{}
				for i, id := range ids {
					weight := 100.0 / float64(len(ids))
					if len(ids) == 3 {
						weight = 33
						if i == 0 {
							weight = 34
						}
					}
					row.Columns = append(row.Columns, Column{Weight: weight, Split: 50, Cards: []*string{id}})
				}
			}
			rows = append(rows, row)
		}
		doc.Layout.Rows = rows
	}
	raw, _ := json.Marshal(doc.Layout)
	return Canonical(domain, raw)
}

// Only the old display settings are retained in the migration receipt; the
// original UCI config remains untouched. Failure to read/export is not "empty".
func LocalLegacySettings() (LegacySettings, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if _, err := os.Stat("/etc/config/quickstart"); errors.Is(err, os.ErrNotExist) {
		return LegacySettings{Disabled: []string{}}, nil
	} else if err != nil {
		return LegacySettings{}, err
	}
	cmd := exec.CommandContext(ctx, "uci", "-q", "export", "quickstart")
	output := &boundedOutput{limit: MaxBytes}
	cmd.Stdout = output
	if err := cmd.Run(); err != nil {
		return LegacySettings{}, errors.New("cannot read previous homepage settings")
	}
	return ParseLegacyExport(output.String())
}

var legacyHeader = regexp.MustCompile(`^config\s+disabledisplay\s+['"]?modules['"]?$`)
var legacyModule = regexp.MustCompile(`^(?:list|option)\s+module\s+['"]?([A-Za-z0-9_.+-]+)['"]?$`)

func ParseLegacyExport(raw string) (LegacySettings, error) {
	result := LegacySettings{Disabled: []string{}}
	active := false
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "config ") {
			active = legacyHeader.MatchString(line)
			if active {
				if result.Exists {
					return LegacySettings{}, ErrInvalid
				}
				result.Exists = true
			}
			continue
		}
		if !active || line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if strings.HasPrefix(line, "list module ") || strings.HasPrefix(line, "option module ") {
			if line == "list module ''" || line == "option module ''" {
				result.Disabled = append(result.Disabled, "")
				continue
			}
			match := legacyModule.FindStringSubmatch(line)
			if len(match) != 2 {
				return LegacySettings{}, ErrInvalid
			}
			result.Disabled = append(result.Disabled, match[1])
		}
	}
	return result, nil
}
