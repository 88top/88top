package service

import "regexp"

var wirelessSection = regexp.MustCompile(`^([a-zA-Z0-9_]+|@wifi-(iface|device)\[[0-9]+\])$`)

func validWirelessSection(name string) bool { return wirelessSection.MatchString(name) }
