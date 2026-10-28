package homeconfig

import (
	"bytes"
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"net/http"
	"os/exec"
	"regexp"
	"time"
)

var errSession = errors.New("valid root session required")
var sessionIDPattern = regexp.MustCompile(`^[a-f0-9]{32}$`)

type Session struct {
	Username string `json:"username"`
	Token    string `json:"token"`
}
type SessionLookup func(context.Context, string) (Session, error)

// LuCI strips incoming forwarded headers and injects its validated session.
// Verify it again in rpcd, including token and root identity. No auth cache can
// prolong an expired session or mix two browsers sharing the root account.
func RootAuthorizer(lookup SessionLookup) Authorize {
	return func(r *http.Request) (Access, error) {
		sid, token := r.Header.Get("X-Forwarded-Sid"), r.Header.Get("X-Forwarded-Token")
		if lookup == nil || !sessionIDPattern.MatchString(sid) || sid == "00000000000000000000000000000000" || len(token) < 1 || len(token) > 256 {
			return Access{}, errSession
		}
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		session, err := lookup(ctx, sid)
		if err != nil || session.Username != "root" || session.Token == "" || subtle.ConstantTimeCompare([]byte(session.Token), []byte(token)) != 1 {
			return Access{}, errSession
		}
		return Access{Read: true, Write: true}, nil
	}
}

type boundedOutput struct {
	bytes.Buffer
	limit int
}

func (b *boundedOutput) Write(p []byte) (int, error) {
	if b.Len()+len(p) > b.limit {
		return 0, errSession
	}
	return b.Buffer.Write(p)
}

func LocalSession(ctx context.Context, sid string) (Session, error) {
	if !sessionIDPattern.MatchString(sid) {
		return Session{}, errSession
	}
	args, _ := json.Marshal(map[string]string{"ubus_rpc_session": sid})
	cmd := exec.CommandContext(ctx, "ubus", "-S", "call", "session", "get", string(args))
	output := &boundedOutput{limit: 64 * 1024}
	cmd.Stdout = output
	if err := cmd.Run(); err != nil {
		return Session{}, errSession
	}
	var result struct {
		Values Session `json:"values"`
	}
	if json.Unmarshal(output.Bytes(), &result) != nil {
		return Session{}, errSession
	}
	return result.Values, nil
}
