package config

import (
	"errors"
	"strconv"
	"strings"

	"github.com/istoreos/quickstart/backend/models"
	"github.com/istoreos/quickstart/backend/utils"
)

// Validate runs before rendering or replacing smartd.conf. Each device must be
// one configuration token, so it cannot introduce smartd directives.
func Validate(req *models.SmartConfigRequest) error {
	if req == nil || req.Global == nil {
		return errors.New("missing smart global config")
	}
	switch req.Global.Powermode {
	case "never", "sleep", "standby", "idle":
	default:
		return errors.New("invalid smart power mode")
	}
	validDevice := func(path string) bool {
		return utils.ValidDevicePath(path) && !strings.ContainsAny(path, " \t\\\"'")
	}
	for _, device := range req.Devices {
		if device == nil || !validDevice(device.DevicePath) {
			return errors.New("invalid smart device")
		}
	}
	for _, task := range req.Tasks {
		if task == nil || !validDevice(task.DevicePath) {
			return errors.New("invalid smart task")
		}
		switch task.Type {
		case "offline", "short", "long", "conveyance":
		default:
			return errors.New("invalid smart task type")
		}
		if !scheduleValue(task.Month, 1, 12) || !scheduleValue(task.DayPerMonth, 1, 31) || !scheduleValue(task.DayPerWeek, 1, 7) || !scheduleValue(task.Hour, 0, 23) {
			return errors.New("invalid smart task schedule")
		}
	}
	return nil
}

func scheduleValue(value string, min, max int) bool {
	if value == "*" {
		return true
	}
	n, err := strconv.Atoi(value)
	return err == nil && n >= min && n <= max
}
