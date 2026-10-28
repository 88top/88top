package homeconfig

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"syscall"
)

var ErrConflict = errors.New("homepage configuration changed; reload before saving")
var ErrReadOnly = errors.New("homepage configuration requires explicit recovery")

// ErrUncertain means rename may have committed but directory sync failed.
// A caller must read back, not blindly retry the mutation.
var ErrUncertain = errors.New("homepage save outcome requires confirmation")

type envelope struct {
	Format     int             `json:"format"`
	Generation string          `json:"generation"`
	Revision   uint64          `json:"revision"`
	Value      json.RawMessage `json:"value"`
	Migration  *LegacySettings `json:"migration,omitempty"`
}
type Snapshot struct {
	Version         string          `json:"version"`
	State           string          `json:"state"`
	Value           json.RawMessage `json:"value,omitempty"`
	RecoveryVersion string          `json:"recoveryVersion,omitempty"`
}
type Store struct {
	mu   sync.Mutex
	root string
	// Internal fault seam used by persistence tests, including after rename.
	write func(string, []byte) error
}

func NewStore(root string) *Store { return &Store{root: root, write: atomicWrite} }
func (s *Store) path(domain string) (string, error) {
	if domain != "layout" && domain != "launcher" {
		return "", ErrInvalid
	}
	return filepath.Join(s.root, "home-"+domain+".json"), nil
}
func boundedRead(path string) ([]byte, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	raw, err := io.ReadAll(io.LimitReader(f, MaxBytes+4097))
	if err != nil {
		return nil, err
	}
	if len(raw) > MaxBytes+4096 {
		return nil, ErrInvalid
	}
	return raw, nil
}
func parseEnvelope(domain string, raw []byte) (envelope, error) {
	var doc envelope
	var header struct {
		Format int `json:"format"`
	}
	if json.Unmarshal(raw, &header) == nil && header.Format > 1 {
		return doc, ErrFuture
	}
	// Envelope adds a bounded amount to the payload's maximum.
	if len(raw) > MaxBytes {
		return doc, ErrInvalid
	}
	if err := DecodeStrict(raw, &doc); err != nil {
		return doc, err
	}
	if doc.Format > 1 {
		return doc, ErrFuture
	}
	if doc.Format != 1 || len(doc.Generation) != 32 || doc.Revision == 0 {
		return doc, ErrInvalid
	}
	if _, err := hex.DecodeString(doc.Generation); err != nil {
		return doc, ErrInvalid
	}
	value, err := Canonical(domain, doc.Value)
	if err != nil {
		return doc, err
	}
	doc.Value = value
	return doc, nil
}
func version(doc envelope) string { return doc.Generation + ":" + strconv.FormatUint(doc.Revision, 10) }
func snapshot(doc envelope, state string) Snapshot {
	return Snapshot{Version: version(doc), State: state, Value: doc.Value}
}

// Read never writes defaults, repairs a file, or replaces future configuration.
// The frontend supplies built-in defaults only for display when Value is absent.
func (s *Store) Read(domain string) (Snapshot, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	path, err := s.path(domain)
	if err != nil {
		return Snapshot{}, err
	}
	return s.read(path, domain)
}
func (s *Store) read(path, domain string) (Snapshot, error) {
	raw, err := boundedRead(path)
	if errors.Is(err, os.ErrNotExist) {
		// Missing primary with a surviving backup is interrupted recovery, not
		// a new installation. Never issue a writable "missing" token in that case.
		if _, backupErr := os.Stat(path + ".bak"); errors.Is(backupErr, os.ErrNotExist) {
			return Snapshot{Version: "missing", State: "missing"}, nil
		}
	} else if err != nil && !errors.Is(err, ErrInvalid) {
		return Snapshot{}, err
	}
	if err == nil {
		doc, parseErr := parseEnvelope(domain, raw)
		if parseErr == nil {
			return snapshot(doc, "saved"), nil
		}
		if errors.Is(parseErr, ErrFuture) {
			return Snapshot{State: "future"}, nil
		}
	}
	token, tokenErr := recoveryVersion(path)
	if tokenErr != nil {
		return Snapshot{}, tokenErr
	}
	backup, backupErr := boundedRead(path + ".bak")
	if backupErr == nil {
		if doc, parseErr := parseEnvelope(domain, backup); parseErr == nil {
			result := snapshot(doc, "backup")
			result.RecoveryVersion = token
			return result, nil
		}
	}
	return Snapshot{State: "damaged", RecoveryVersion: token}, nil
}

// Hash files in a streaming pass, with a hard limit. Excessively large corrupt
// files require manual recovery instead of unbounded reads or risky overwrite.
func recoveryVersion(path string) (string, error) {
	h := sha256.New()
	for _, file := range []string{path, path + ".bak"} {
		f, err := os.Open(file)
		if errors.Is(err, os.ErrNotExist) {
			h.Write([]byte("missing\x00"))
			continue
		}
		if err != nil {
			return "", err
		}
		n, copyErr := io.Copy(h, io.LimitReader(f, MaxBytes+4097))
		f.Close()
		if copyErr != nil {
			return "", copyErr
		}
		if n > MaxBytes+4096 {
			return "", nil
		}
		fmt.Fprintf(h, "\x00%d\x00", n)
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// RestoreBackup is a separate explicit action. The damaged primary is retained
// as a hard link before replacement; an existing archive is never overwritten.
// A new generation invalidates all pre-recovery editing sessions and caches.
func (s *Store) RestoreBackup(domain, expectedRecovery string) (Snapshot, error) {
	return s.restore(domain, expectedRecovery, false)
}
func (s *Store) RestoreDefaults(domain, expectedRecovery string) (Snapshot, error) {
	return s.restore(domain, expectedRecovery, true)
}
func (s *Store) restore(domain, expectedRecovery string, reset bool) (Snapshot, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	path, err := s.path(domain)
	if err != nil {
		return Snapshot{}, err
	}
	lock, err := os.OpenFile(path+".lock", os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return Snapshot{}, err
	}
	defer lock.Close()
	if err = syscall.Flock(int(lock.Fd()), syscall.LOCK_EX); err != nil {
		return Snapshot{}, err
	}
	defer syscall.Flock(int(lock.Fd()), syscall.LOCK_UN)
	current, err := s.read(path, domain)
	if err != nil {
		return Snapshot{}, err
	}
	if (!reset && current.State != "backup") || (reset && current.State != "damaged") {
		return Snapshot{}, ErrReadOnly
	}
	if expectedRecovery == "" || current.RecoveryVersion != expectedRecovery {
		return Snapshot{}, ErrConflict
	}
	var doc envelope
	var raw []byte
	if reset {
		doc.Format = 1
		doc.Value, err = InitialValue(domain, LegacySettings{})
	} else {
		raw, err = boundedRead(path + ".bak")
		if err == nil {
			doc, err = parseEnvelope(domain, raw)
		}
	}
	if err != nil {
		return Snapshot{}, err
	}
	if reset {
		if _, err = os.Stat(path + ".bak"); err == nil {
			if err = os.Link(path+".bak", path+".bak.damaged"); err != nil {
				before, e1 := os.Stat(path + ".bak")
				after, e2 := os.Stat(path + ".bak.damaged")
				if e1 != nil || e2 != nil || !os.SameFile(before, after) {
					return Snapshot{}, ErrReadOnly
				}
			}
		} else if !errors.Is(err, os.ErrNotExist) {
			return Snapshot{}, err
		}
	}
	if err = os.Link(path, path+".damaged"); err != nil && !errors.Is(err, os.ErrNotExist) {
		primary, primaryErr := os.Stat(path)
		archive, archiveErr := os.Stat(path + ".damaged")
		if primaryErr != nil || archiveErr != nil || !os.SameFile(primary, archive) {
			return Snapshot{}, ErrReadOnly
		}
	}
	dir, err := os.Open(s.root)
	if err != nil {
		return Snapshot{}, err
	}
	err = dir.Sync()
	dir.Close()
	if err != nil {
		return Snapshot{}, err
	}
	generation := make([]byte, 16)
	if _, err = rand.Read(generation); err != nil {
		return Snapshot{}, err
	}
	doc.Generation = hex.EncodeToString(generation)
	doc.Revision = 1
	raw, err = json.Marshal(doc)
	if err != nil {
		return Snapshot{}, err
	}
	if reset {
		if err = s.write(path+".bak", raw); err != nil {
			return Snapshot{}, err
		}
	}
	if err = s.write(path, raw); err != nil {
		return Snapshot{}, err
	}
	return snapshot(doc, "saved"), nil
}

// Save mutates one domain. Its process lock is supplemented by flock so two
// running backend processes cannot both accept the same expected version.
func (s *Store) Save(domain, expected string, value []byte) (Snapshot, error) {
	return s.save(domain, expected, value, nil)
}
func (s *Store) save(domain, expected string, value []byte, migration *LegacySettings) (Snapshot, error) {
	canonical, err := Canonical(domain, value)
	if err != nil {
		return Snapshot{}, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	path, err := s.path(domain)
	if err != nil {
		return Snapshot{}, err
	}
	if err := os.MkdirAll(s.root, 0700); err != nil {
		return Snapshot{}, err
	}
	lock, err := os.OpenFile(path+".lock", os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return Snapshot{}, err
	}
	defer lock.Close()
	if err := syscall.Flock(int(lock.Fd()), syscall.LOCK_EX); err != nil {
		return Snapshot{}, err
	}
	defer syscall.Flock(int(lock.Fd()), syscall.LOCK_UN)
	current, err := s.read(path, domain)
	if err != nil {
		return Snapshot{}, err
	}
	if current.State != "missing" && current.State != "saved" {
		return Snapshot{}, ErrReadOnly
	}
	if expected == "" || expected != current.Version {
		return Snapshot{}, ErrConflict
	}
	if bytes.Equal(canonical, current.Value) {
		return current, nil
	}
	doc := envelope{Format: 1, Revision: 1, Value: canonical, Migration: migration}
	if current.State == "saved" {
		raw, err := boundedRead(path)
		if err != nil {
			return Snapshot{}, err
		}
		old, err := parseEnvelope(domain, raw)
		if err != nil {
			return Snapshot{}, err
		}
		if old.Revision == ^uint64(0) {
			return Snapshot{}, ErrReadOnly
		}
		doc.Generation, doc.Revision = old.Generation, old.Revision+1
		doc.Migration = old.Migration
		// Back up only a fully validated current file, before touching primary.
		if err := s.write(path+".bak", raw); err != nil {
			return Snapshot{}, err
		}
	} else {
		generation := make([]byte, 16)
		if _, err := rand.Read(generation); err != nil {
			return Snapshot{}, err
		}
		doc.Generation = hex.EncodeToString(generation)
	}
	raw, err := json.Marshal(doc)
	if err != nil || len(raw) > MaxBytes {
		return Snapshot{}, ErrInvalid
	}
	// The first confirmed configuration also has a valid recovery copy. If the
	// primary write is interrupted, the surviving backup remains explicitly
	// read-only until restored; it is never mistaken for a fresh installation.
	if current.State == "missing" {
		if err := s.write(path+".bak", raw); err != nil {
			return Snapshot{}, err
		}
	}
	if err := s.write(path, raw); err != nil {
		return Snapshot{}, err
	}
	return snapshot(doc, "saved"), nil
}

func atomicWrite(path string, raw []byte) error {
	dir := filepath.Dir(path)
	f, err := os.CreateTemp(dir, ".home-config-*")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	defer f.Close()
	if err := f.Chmod(0600); err != nil {
		return err
	}
	if _, err := f.Write(raw); err != nil {
		return err
	}
	if err := f.Sync(); err != nil {
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	if err := os.Rename(f.Name(), path); err != nil {
		return err
	}
	d, err := os.Open(dir)
	if err != nil {
		return fmt.Errorf("%w", ErrUncertain)
	}
	defer d.Close()
	if err := d.Sync(); err != nil {
		return ErrUncertain
	}
	return nil
}
