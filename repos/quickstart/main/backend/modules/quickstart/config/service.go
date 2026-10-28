package config

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/istoreos/quickstart/backend/models"
	"github.com/istoreos/quickstart/backend/utils"
)

type Store interface {
	EnsureConfig(ctx context.Context) error
	Run(ctx context.Context, commands []string) error
	Output(ctx context.Context, commands []string) (string, error)
}

type Service struct {
	store Store
}

func NewService(store Store) *Service {
	return &Service{store: store}
}

func (service *Service) Set(ctx context.Context, req models.QuickstartConfigRequest) (*models.SDKNormalResponse, error) {
	if err := service.store.EnsureConfig(ctx); err != nil {
		return nil, err
	}
	if !validKey(req.Key) || (req.Type != "" && req.Type != "option" && req.Type != "list") || !validValues(req.Values) {
		return nil, errors.New("配置参数错误")
	}
	if err := service.store.Run(ctx, BuildSetCommands(req)); err != nil {
		return nil, errors.New("设置失败")
	}
	return normalSuccess(), nil
}

func (service *Service) Get(ctx context.Context, req models.QuickstartGetConfigRequest) (*models.QuickstartConfigResponse, error) {
	if !validKey(req.Key) {
		return nil, errors.New("配置参数错误")
	}
	out, err := service.store.Output(ctx, []string{fmt.Sprintf("uci show quickstart.main.%v", req.Key)})
	if err != nil {
		return nil, errors.New("获取信息失败")
	}
	result, err := ParseGetOutput(req.Key, out)
	if err != nil {
		return nil, err
	}
	return &models.QuickstartConfigResponse{Result: result}, nil
}

func (service *Service) Delete(ctx context.Context, req models.QuickstartDeleteConfigRequest) (*models.SDKNormalResponse, error) {
	if !validKey(req.Key) {
		return nil, errors.New("配置参数错误")
	}
	if err := service.store.Run(ctx, BuildDeleteCommands(req.Key)); err != nil {
		return nil, errors.New("删除失败")
	}
	return normalSuccess(), nil
}

func (service *Service) GetGlobalFolders(ctx context.Context) (*models.GlobalFoldersResponse, error) {
	if err := service.store.EnsureConfig(ctx); err != nil {
		return nil, err
	}
	out, err := service.store.Output(ctx, []string{"uci show quickstart.main | grep -F 'quickstart.main.' | sed 's/^quickstart\\.main\\.//g'"})
	if err != nil {
		return nil, errors.New("获取信息失败")
	}
	result, err := ParseGlobalFoldersOutput(out)
	if err != nil {
		return nil, err
	}
	return &models.GlobalFoldersResponse{Result: result}, nil
}

func (service *Service) SetGlobalFolders(ctx context.Context, req models.GlobalFolders) (*models.SDKNormalResponse, error) {
	for _, path := range []string{req.Home, req.Configs, req.Public, req.Downloads, req.Caches} {
		// Empty options retain the existing default-directory behavior.
		if strings.ContainsAny(path, "\x00\r\n") || (path != "" && !strings.HasPrefix(path, "/")) {
			return nil, errors.New("目录参数错误")
		}
	}
	if err := service.store.EnsureConfig(ctx); err != nil {
		return nil, err
	}
	if err := service.store.Run(ctx, BuildGlobalFoldersCommands(req)); err != nil {
		return nil, errors.New("设置失败")
	}
	return normalSuccess(), nil
}

func BuildSetCommands(req models.QuickstartConfigRequest) []string {
	cmds := make([]string, 0, len(req.Values)+1)
	if req.Type == "list" {
		for _, v := range req.Values {
			cmds = append(cmds, fmt.Sprintf("uci add_list quickstart.main.%v=%v", req.Key, utils.ShellQuote(v)))
		}
	} else {
		for _, v := range req.Values {
			cmds = append(cmds, fmt.Sprintf("uci set quickstart.main.%v=%v", req.Key, utils.ShellQuote(v)))
		}
	}
	cmds = append(cmds, "uci commit quickstart")
	return cmds
}

func BuildDeleteCommands(key string) []string {
	return []string{
		fmt.Sprintf("uci delete quickstart.main.%v", key),
		"uci commit quickstart",
	}
}

func ParseGetOutput(key string, out string) (*models.QuickstartConfigResponseResult, error) {
	values, err := parseOptionValues(out)
	if err != nil || len(values) == 0 {
		return nil, errors.New("没有对应的值")
	}
	model := &models.QuickstartConfigResponseResult{Key: key}
	if len(values) > 1 {
		model.Type = "list"
	} else {
		model.Type = "option"
	}
	model.Values = values
	return model, nil
}

func BuildGlobalFoldersCommands(req models.GlobalFolders) []string {
	return []string{
		"uci set quickstart.main.main_dir=" + utils.ShellQuote(req.Home),
		"uci set quickstart.main.conf_dir=" + utils.ShellQuote(req.Configs),
		"uci set quickstart.main.pub_dir=" + utils.ShellQuote(req.Public),
		"uci set quickstart.main.dl_dir=" + utils.ShellQuote(req.Downloads),
		"uci set quickstart.main.tmp_dir=" + utils.ShellQuote(req.Caches),
		"uci commit quickstart",
	}
}

func ParseGlobalFoldersOutput(out string) (*models.GlobalFolders, error) {
	if strings.TrimSpace(out) == "" {
		return nil, errors.New("没有对应的值")
	}
	model := &models.GlobalFolders{}
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		key, _, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		if key != "main_dir" && key != "conf_dir" && key != "pub_dir" && key != "dl_dir" && key != "tmp_dir" {
			continue
		}
		values, err := parseOptionValues(line)
		if err != nil || len(values) != 1 {
			return nil, errors.New("获取信息失败")
		}
		switch key {
		case "main_dir":
			model.Home = values[0]
		case "conf_dir":
			model.Configs = values[0]
		case "pub_dir":
			model.Public = values[0]
		case "dl_dir":
			model.Downloads = values[0]
		case "tmp_dir":
			model.Caches = values[0]
		}
	}
	return model, nil
}

var optionKey = regexp.MustCompile(`^[a-zA-Z0-9_]+$`)

func validKey(key string) bool { return optionKey.MatchString(key) }

func validValues(values []string) bool {
	for _, value := range values {
		if strings.ContainsAny(value, "\x00\r\n") {
			return false
		}
	}
	return true
}

// UCI show emits shell-quoted literal values. Decode its quoting without ever
// asking a shell to evaluate configuration data (including escaped apostrophes).
func parseOptionValues(out string) ([]string, error) {
	var values []string
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		_, raw, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		var value strings.Builder
		var quote byte
		started := false
		for i := 0; i < len(raw); i++ {
			c := raw[i]
			switch {
			case c == '\\' && quote != '\'':
				i++
				if i >= len(raw) {
					return nil, errors.New("invalid UCI quoting")
				}
				value.WriteByte(raw[i])
				started = true
			case quote != 0:
				if c == quote {
					quote = 0
				} else {
					value.WriteByte(c)
				}
			case c == '\'' || c == '"':
				quote = c
				started = true
			case c == ' ' || c == '\t':
				if started {
					values = append(values, value.String())
					value.Reset()
					started = false
				}
			default:
				value.WriteByte(c)
				started = true
			}
		}
		if quote != 0 {
			return nil, errors.New("invalid UCI quoting")
		}
		if started {
			values = append(values, value.String())
		}
	}
	return values, nil
}

func normalSuccess() *models.SDKNormalResponse {
	success := models.ResponseSuccess(int64(0))
	return &models.SDKNormalResponse{Success: &success}
}
