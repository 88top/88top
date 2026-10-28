package utils

import "strings"

// UCIQuote encodes a literal value in UCI's batch language. Callers must reject
// line terminators: the CLI reads batch commands one line at a time.
func UCIQuote(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "'\\''") + "'"
}
