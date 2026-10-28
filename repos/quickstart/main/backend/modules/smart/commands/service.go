package commands

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/istoreos/quickstart/backend/models"
	"github.com/istoreos/quickstart/backend/utils"
)

type Store interface {
	OutputWithErr(ctx context.Context, commands []string) (string, string, error)
	Output(ctx context.Context, commands []string) (string, error)
}

type Service struct {
	store Store
}

func NewService(store Store) *Service {
	return &Service{store: store}
}

func (service *Service) StartTest(ctx context.Context, req models.SmartTestRequest) (*models.SmartTestResponse, error) {
	if !utils.ValidDevicePath(req.DevicePath) || req.Type == "" || strings.ContainsAny(req.Type, "\x00\r\n") {
		return nil, errors.New("smart参数错误")
	}
	stdout, _, err := service.store.OutputWithErr(ctx, []string{
		fmt.Sprintf("smartctl -t %v %v", utils.ShellQuote(req.Type), utils.ShellQuote(req.DevicePath)),
	})
	model := models.SmartTestResponseResult{}
	if err != nil {
		model.Result = "磁盘测试正在运行\n" + stdout
	} else {
		model.Result = "磁盘检测运行成功"
	}
	return &models.SmartTestResponse{Result: &model}, nil
}

func (service *Service) TestResult(ctx context.Context, req models.SmartTestResultRequest) (*models.SmartTestResultResponse, error) {
	if !utils.ValidDevicePath(req.DevicePath) || req.Type == "" || strings.ContainsAny(req.Type, "\x00\r\n") {
		return nil, errors.New("smart获取测试结果失败")
	}
	out, err := service.store.Output(ctx, []string{
		fmt.Sprintf("smartctl -l %v %v", utils.ShellQuote(req.Type), utils.ShellQuote(req.DevicePath)),
	})
	if err != nil {
		return nil, errors.New("smart获取测试结果失败")
	}
	model := models.SmartTestResultResponseResult{Result: out}
	return &models.SmartTestResultResponse{Result: &model}, nil
}

func (service *Service) AttributeResult(ctx context.Context, req models.SmartAttributeResultRequest) (*models.SmartAttributeResultResponse, error) {
	if !utils.ValidDevicePath(req.DevicePath) {
		return nil, errors.New("smart获取测试结果失败")
	}
	out, err := service.store.Output(ctx, []string{
		fmt.Sprintf("smartctl -A %v", utils.ShellQuote(req.DevicePath)),
	})
	if err != nil {
		return nil, errors.New("smart获取测试结果失败")
	}
	model := models.SmartAttributeResultResponseResult{Result: out}
	return &models.SmartAttributeResultResponse{Result: &model}, nil
}

func (service *Service) ExtendResult(ctx context.Context, req models.SmartExtendResultRequest) (*models.SmartExtendResultResponse, error) {
	if !utils.ValidDevicePath(req.DevicePath) {
		return nil, errors.New("smart获取测试结果失败")
	}
	out, err := service.store.Output(ctx, []string{
		fmt.Sprintf("smartctl -a %v", utils.ShellQuote(req.DevicePath)),
	})
	if err != nil {
		return nil, errors.New("smart获取测试结果失败")
	}
	model := models.SmartExtendResultResponseResult{Result: out}
	return &models.SmartExtendResultResponse{Result: &model}, nil
}
