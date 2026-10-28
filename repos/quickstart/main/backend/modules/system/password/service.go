package password

import (
	"context"
	"encoding/json"
	"errors"
	"strings"

	"github.com/istoreos/quickstart/backend/models"
)

type Store interface {
	CallSetPassword(ctx context.Context, command string) (bool, error)
}

type Service struct {
	store Store
}

func NewService(store Store) *Service {
	return &Service{store: store}
}

func (svc *Service) SetRootPassword(ctx context.Context, req models.NasSystemSetPasswordRequest) (*models.SDKNormalResponse, error) {
	// Missing/null JSON fields decode to an empty string. Never turn a bad
	// request into passwordless root access. The system password helper also
	// accepts C strings / line-delimited input, so reject terminators before
	// handing the value to ubus.
	if req.Password == "" {
		return nil, errors.New("密码不能为空")
	}
	if strings.ContainsAny(req.Password, "\x00\r\n") {
		return nil, errors.New("密码包含不支持的控制字符")
	}
	changed, err := svc.store.CallSetPassword(ctx, BuildSetRootPasswordCommand(req.Password))
	if err != nil {
		return nil, errors.New("设置密码错误")
	}
	if !changed {
		resp := models.SDKNormalResponse{
			Error: models.ResponseError("-100"),
			Scope: models.ResponseScope("system.setpassd"),
		}
		return &resp, nil
	}

	success := models.ResponseSuccess(int64(0))
	resp := models.SDKNormalResponse{Success: &success}
	return &resp, nil
}

func BuildSetRootPasswordCommand(password string) string {
	data, _ := json.Marshal(struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}{Username: "root", Password: password})
	return "luci setPassword " + string(data)
}
