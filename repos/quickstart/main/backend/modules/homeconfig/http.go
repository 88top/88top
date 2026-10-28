package homeconfig

import (
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"
	"net/url"
)

// Authorize is supplied by the authenticated router integration. The storage
// module knows no accounts, browser identities, cookies or LuCI ACL policy.
// A nil authorizer fails closed; merely presenting X-Forwarded-Sid is not proof.
type Access struct {
	Read  bool
	Write bool
}
type Authorize func(*http.Request) (Access, error)
type saveRequest struct {
	ExpectedVersion string          `json:"expectedVersion"`
	Value           json.RawMessage `json:"value"`
}

func Handler(store Repository, domain string, authorize Authorize) http.Handler {
	return handler(store, domain, authorize, "")
}
func RestoreHandler(store Repository, domain string, authorize Authorize) http.Handler {
	return handler(store, domain, authorize, "backup")
}
func ResetHandler(store Repository, domain string, authorize Authorize) http.Handler {
	return handler(store, domain, authorize, "defaults")
}
func handler(store Repository, domain string, authorize Authorize, restore string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Content-Type", "application/json")
		if r.Method != http.MethodGet && r.Method != http.MethodPost || restore != "" && r.Method != http.MethodPost {
			w.Header().Set("Allow", "GET, POST")
			writeError(w, 405, "method")
			return
		}
		if authorize == nil {
			writeError(w, 403, "forbidden")
			return
		}
		access, err := authorize(r)
		if err != nil || !access.Read || r.Method == http.MethodPost && !access.Write {
			writeError(w, 403, "forbidden")
			return
		}
		var result Snapshot
		if r.Method == http.MethodGet {
			result, err = store.Read(domain)
		} else {
			contentType, _, parseErr := mime.ParseMediaType(r.Header.Get("Content-Type"))
			if parseErr != nil || contentType != "application/json" || r.Header.Get("Sec-Fetch-Site") == "cross-site" {
				writeError(w, 400, "invalid")
				return
			}
			if origin := r.Header.Get("Origin"); origin != "" {
				u, parseErr := url.Parse(origin)
				if parseErr != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host != r.Host {
					writeError(w, 403, "forbidden")
					return
				}
			}
			raw, readErr := io.ReadAll(http.MaxBytesReader(w, r.Body, MaxBytes))
			if readErr != nil {
				writeError(w, 413, "invalid")
				return
			}
			if restore != "" {
				var req struct {
					ExpectedRecovery string `json:"expectedRecovery"`
				}
				if DecodeStrict(raw, &req) != nil {
					writeError(w, 422, "invalid")
					return
				}
				if restore == "defaults" {
					result, err = store.RestoreDefaults(domain, req.ExpectedRecovery)
				} else {
					result, err = store.RestoreBackup(domain, req.ExpectedRecovery)
				}
			} else {
				var req saveRequest
				if DecodeStrict(raw, &req) != nil {
					writeError(w, 422, "invalid")
					return
				}
				result, err = store.Save(domain, req.ExpectedVersion, req.Value)
			}
		}
		if err != nil {
			switch {
			case errors.Is(err, ErrConflict):
				writeError(w, 409, "conflict")
			case errors.Is(err, ErrInvalid), errors.Is(err, ErrFuture):
				writeError(w, 422, "invalid")
			case errors.Is(err, ErrReadOnly):
				writeError(w, 423, "readonly")
			case errors.Is(err, ErrUncertain):
				writeError(w, 503, "uncertain")
			default:
				writeError(w, 503, "unavailable")
			}
			return
		}
		// No raw error text, path, session ID, URL, or link data is logged.
		json.NewEncoder(w).Encode(struct {
			Success int      `json:"success"`
			Result  Snapshot `json:"result"`
			CanEdit bool     `json:"canEdit"`
		}{Result: result, CanEdit: access.Write})
	})
}
func writeError(w http.ResponseWriter, status int, code string) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(struct {
		Success int    `json:"success"`
		Error   string `json:"error"`
	}{Success: -1, Error: code})
}
