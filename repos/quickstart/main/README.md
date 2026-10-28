# Quickstart

Quickstart is the iStoreOS dashboard and setup interface, with a Go backend and
a Vue 3 frontend. It provides system information, network setup, LAN device
management, and access to installed applications.

This repository is under active development. For installation, use the packages
provided by your iStoreOS firmware or software center.

## Development

- [Development guide](docs/development.md): setup, build, and local checks.
- [Documentation](docs/README.md): architecture and contributor references.
- Backend: `backend/`; frontend: `web/`; build commands: `make help`.
- LuCI integration and packaging live in
  [nas-packages-luci](https://github.com/linkease/nas-packages-luci/tree/main/luci/luci-app-quickstart).

Licensed under [MIT](LICENSE). See [NOTICE.md](NOTICE.md) for asset provenance.
