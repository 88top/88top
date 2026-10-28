package password

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"github.com/istoreos/quickstart/backend/models"
)

func TestPasswordCommandPreservesSpecialCharacters(t *testing.T) {
	password := "spaces ' quotes \" slash \\ newline\n中文"
	var value struct{ Username, Password string }
	if err := json.Unmarshal([]byte(strings.TrimPrefix(BuildSetRootPasswordCommand(password), "luci setPassword ")), &value); err != nil {
		t.Fatal(err)
	}
	if value.Username != "root" || value.Password != password {
		t.Fatalf("password was altered: %#v", value)
	}
}

type fakeStore struct {
	command string
	changed bool
	err     error
}

func (store *fakeStore) CallSetPassword(ctx context.Context, command string) (bool, error) {
	store.command = command
	return store.changed, store.err
}

func TestInvalidPasswordDoesNotReachSystemHelper(t *testing.T) {
	for _, value := range []string{"", "\x00", "\x00secret", "secret\x00suffix", "secret\nroot:other", "secret\r"} {
		t.Run(value, func(t *testing.T) {
			store := &fakeStore{changed: true}
			resp, err := NewService(store).SetRootPassword(context.Background(), models.NasSystemSetPasswordRequest{Password: value})
			if err == nil || resp != nil || store.command != "" {
				t.Fatalf("invalid password reached system helper: response=%#v error=%v called=%t", resp, err, store.command != "")
			}
		})
	}
}

func TestValidSpecialPasswordIsNotAltered(t *testing.T) {
	value := "spaces ' quotes \" slash \\ 中文"
	store := &fakeStore{changed: true}
	if _, err := NewService(store).SetRootPassword(context.Background(), models.NasSystemSetPasswordRequest{Password: value}); err != nil {
		t.Fatal(err)
	}
	var decoded struct{ Password string }
	if err := json.Unmarshal([]byte(strings.TrimPrefix(store.command, "luci setPassword ")), &decoded); err != nil || decoded.Password != value {
		t.Fatalf("valid password changed: error=%v", err)
	}
}

func TestSetRootPasswordBuildsCommandAndReturnsSuccess(t *testing.T) {
	t.Parallel()

	store := &fakeStore{changed: true}
	svc := NewService(store)

	resp, err := svc.SetRootPassword(context.Background(), models.NasSystemSetPasswordRequest{
		Password: "secret",
	})
	if err != nil {
		t.Fatalf("SetRootPassword returned error: %v", err)
	}
	if store.command != `luci setPassword {"username":"root","password":"secret"}` {
		t.Fatalf("command = %q", store.command)
	}
	if resp.Success == nil || *resp.Success != models.ResponseSuccess(0) {
		t.Fatalf("Success = %#v, want 0", resp.Success)
	}
}

func TestSetRootPasswordMapsStoreError(t *testing.T) {
	t.Parallel()

	svc := NewService(&fakeStore{err: errors.New("ubus failed")})

	if _, err := svc.SetRootPassword(context.Background(), models.NasSystemSetPasswordRequest{
		Password: "secret",
	}); err == nil || err.Error() != "设置密码错误" {
		t.Fatalf("SetRootPassword error = %v, want 设置密码错误", err)
	}
}

func TestSetRootPasswordReturnsBusinessErrorWhenPasswordUnchanged(t *testing.T) {
	t.Parallel()

	svc := NewService(&fakeStore{changed: false})

	resp, err := svc.SetRootPassword(context.Background(), models.NasSystemSetPasswordRequest{
		Password: "secret",
	})
	if err != nil {
		t.Fatalf("SetRootPassword returned error: %v", err)
	}
	if resp.Error != models.ResponseError("-100") {
		t.Fatalf("Error = %q, want -100", resp.Error)
	}
	if resp.Scope != models.ResponseScope("system.setpassd") {
		t.Fatalf("Scope = %q, want system.setpassd", resp.Scope)
	}
}
