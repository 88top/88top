package api

import (
	"regexp"
	"strings"
)

// A stop-reason line from NTrace-core can contain ICMP and may be followed by
// the next carrier header without a newline when an older nt3 formatter is in
// use. Repair that boundary at the public text boundary as a final defense.
// The first expression handles parenthesized responses; the second covers
// custom reasons without a response block. The pass repeats because an older
// formatter can concatenate more than one route section onto one line.
var (
	traceStopHeaderBoundaryPattern = regexp.MustCompile(`(?i)(Trace Stopped:[^\r\n]*\))((?:\x1b\[[0-?]*[ -/]*[@-~])*[^\r\n]*?[ \t]+-[ \t]+ICMP[ \t]+v[46][ \t]+-[ \t]*)`)
	traceStopHeaderNoParenPattern  = regexp.MustCompile(`(?i)(Trace Stopped:[^\r\n]*?\bat[ \t]+Hop[ \t]+[0-9]+)((?:\x1b\[[0-?]*[ -/]*[@-~])*[^)\r\n]*?[ \t]+-[ \t]+ICMP[ \t]+v[46][ \t]+-[ \t]*)`)
	traceDestinationReachedPattern = regexp.MustCompile(`(?i)Trace Stopped:[ \t]*Destination Reached\b[^\r\n]*?(?:\)|$)`)
)

func normalizeTraceOutputBoundaries(value string) string {
	for {
		normalized := traceStopHeaderBoundaryPattern.ReplaceAllString(value, "$1\n$2")
		normalized = traceStopHeaderNoParenPattern.ReplaceAllString(normalized, "$1\n$2")
		if normalized == value {
			return filterTerminalTraceStops(value)
		}
		value = normalized
	}
}

// filterTerminalTraceStops removes the normal ICMP terminal marker after
// boundaries are repaired. Other stop reasons are diagnostic and remain
// visible. Keeping this final defense here covers raw/older nt3 output that
// bypasses the component formatter before it reaches API or GUI callers.
func filterTerminalTraceStops(value string) string {
	lines := strings.Split(value, "\n")
	filtered := lines[:0]
	for _, line := range lines {
		hadTerminalStop := traceDestinationReachedPattern.MatchString(line)
		line = traceDestinationReachedPattern.ReplaceAllString(line, "")
		if hadTerminalStop && strings.TrimSpace(line) == "" {
			continue
		}
		filtered = append(filtered, line)
	}
	return strings.Join(filtered, "\n")
}
