package server

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/istoreos/quickstart/backend/modules/homeconfig"
)

// Exercise the assembled router: a module-level check cannot prove that every
// old route, alias and future module is protected at the HTTP boundary.
func TestRouterRejectsForgedSession(t *testing.T) {
	for _, path := range []string{
		"/cgi-bin/luci/istore/system/version/",
		"/cgi-bin/luci/istore/u/system/version/",
		"/cgi-bin/luci/istore/guide/ddns/",
	} {
		r := httptest.NewRequest(http.MethodGet, path, nil)
		r.Header.Set("X-Forwarded-Sid", "11111111111111111111111111111111")
		r.Header.Set("X-Forwarded-Token", "forged")
		w := httptest.NewRecorder()
		RouterInit(nil).ServeHTTP(w, r)
		var result struct {
			Success int `json:"success"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil || result.Success != -1001 {
			t.Errorf("%s: forged session reached router: %s", path, w.Body.String())
		}
	}
}

func TestHTTPBoundaryLimitsKnownAndStreamingBodies(t *testing.T) {
	allow := func(*http.Request) (homeconfig.Access, error) { return homeconfig.Access{Read: true, Write: true}, nil }
	for _, known := range []bool{true, false} {
		r := httptest.NewRequest("POST", "http://router.test/", strings.NewReader(strings.Repeat("x", maxRequestBody+1)))
		if !known {
			r.ContentLength = -1
		}
		r.Header.Set("Content-Type", "application/json")
		h := secureHTTP(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if _, err := io.ReadAll(r.Body); err == nil {
				t.Fatal("oversized streamed body accepted")
			}
		}), allow)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		if known && w.Code != http.StatusRequestEntityTooLarge {
			t.Fatal(w.Code)
		}
	}
}

func TestHTTPBoundarySessionAndCSRF(t *testing.T) {
	const sid = "11111111111111111111111111111111"
	for _, tc := range []struct {
		name, user, token, origin, site, contentType string
		expired                                      bool
		want                                         int
	}{
		{name: "root JSON", user: "root", token: "secret", contentType: "application/json;charset=utf-8", want: 204},
		{name: "same origin", user: "root", token: "secret", origin: "https://router.test", site: "same-origin", contentType: "application/json", want: 204},
		{name: "non-root", user: "guest", token: "secret", want: 200},
		{name: "bad token", user: "root", token: "bad", want: 200},
		{name: "expired", user: "root", token: "secret", expired: true, want: 200},
		{name: "HTML form", user: "root", token: "secret", contentType: "application/x-www-form-urlencoded", want: 415},
		{name: "plain JSON", user: "root", token: "secret", contentType: "text/plain", want: 415},
		{name: "no type", user: "root", token: "secret", want: 415},
		{name: "foreign origin", user: "root", token: "secret", origin: "https://evil.test", contentType: "application/json", want: 403},
		{name: "null origin", user: "root", token: "secret", origin: "null", contentType: "application/json", want: 403},
		{name: "suffix origin", user: "root", token: "secret", origin: "https://router.test.evil.test", contentType: "application/json", want: 403},
		{name: "wrong port", user: "root", token: "secret", origin: "https://router.test:444", contentType: "application/json", want: 403},
		{name: "cross site", user: "root", token: "secret", site: "cross-site", contentType: "application/json", want: 403},
		{name: "sibling origin", user: "root", token: "secret", site: "same-site", contentType: "application/json", want: 403},
	} {
		t.Run(tc.name, func(t *testing.T) {
			called := false
			lookup := func(context.Context, string) (homeconfig.Session, error) {
				if tc.expired {
					return homeconfig.Session{}, errors.New("expired")
				}
				return homeconfig.Session{Username: tc.user, Token: "secret"}, nil
			}
			h := secureHTTP(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				called = true
				w.WriteHeader(204)
			}), homeconfig.RootAuthorizer(lookup))
			r := httptest.NewRequest("POST", "https://router.test/cgi-bin/luci/istore/system/setPassword/", strings.NewReader(`{}`))
			for k, v := range map[string]string{"X-Forwarded-Sid": sid, "X-Forwarded-Token": tc.token, "Origin": tc.origin, "Sec-Fetch-Site": tc.site, "Content-Type": tc.contentType} {
				r.Header.Set(k, v)
			}
			w := httptest.NewRecorder()
			h.ServeHTTP(w, r)
			if w.Code != tc.want || called != (tc.want == 204) {
				t.Fatalf("status=%d called=%v body=%s", w.Code, called, w.Body.String())
			}
			if tc.want == 200 && !strings.Contains(w.Body.String(), `"success":-1001`) {
				t.Fatal(w.Body.String())
			}
			if w.Header().Get("Cache-Control") != "no-store" {
				t.Fatal("authenticated response can be cached")
			}
		})
	}
}
