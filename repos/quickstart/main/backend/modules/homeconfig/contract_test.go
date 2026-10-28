package homeconfig

import (
	"encoding/json"
	"os"
	"testing"
)

func TestSharedFrontendBackendContract(t *testing.T) {
	raw, err := os.ReadFile("../../../docs/contracts/home-config.json")
	if err != nil {
		t.Fatal(err)
	}
	var fixture struct {
		Layout   json.RawMessage `json:"layout"`
		Launcher json.RawMessage `json:"launcher"`
		Cases    []struct {
			Name    string `json:"name"`
			Domain  string `json:"domain"`
			Valid   bool   `json:"valid"`
			Changes []struct {
				Path  []any `json:"path"`
				Value any   `json:"value"`
			} `json:"changes"`
		} `json:"cases"`
	}
	if err := json.Unmarshal(raw, &fixture); err != nil {
		t.Fatal(err)
	}
	for _, item := range fixture.Cases {
		t.Run(item.Name, func(t *testing.T) {
			base := fixture.Layout
			if item.Domain == "launcher" {
				base = fixture.Launcher
			}
			var doc any
			if err := json.Unmarshal(base, &doc); err != nil {
				t.Fatal(err)
			}
			for _, change := range item.Changes {
				target := doc
				for i, key := range change.Path {
					last := i == len(change.Path)-1
					switch key := key.(type) {
					case string:
						object := target.(map[string]any)
						if last {
							object[key] = change.Value
						} else {
							target = object[key]
						}
					case float64:
						array := target.([]any)
						if last {
							array[int(key)] = change.Value
						} else {
							target = array[int(key)]
						}
					default:
						t.Fatal("invalid fixture path")
					}
				}
			}
			input, _ := json.Marshal(doc)
			_, err := Canonical(item.Domain, input)
			if (err == nil) != item.Valid {
				t.Fatalf("valid=%t, error=%v", item.Valid, err)
			}
		})
	}
}
