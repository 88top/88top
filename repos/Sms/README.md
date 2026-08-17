![LOGO](android/app/src/main/res/mipmap-xhdpi/ic_launcher.png)

# SMS Cleaner

[简体中文](README_zh.md) | [繁體中文](README_zh_TW.md) | English

- SMS Cleaner is a tool for reading and batch deleting SMS messages on Android, built with Flutter framework.
- Although the UI framework Flutter supports cross-platform development, only Android SMS deletion functionality has been implemented.

## Features

- Get SMS permissions
- Copy SMS to clipboard
- Set/restore default SMS app
- Filter SMS messages by keywords
- Search SMS by phone number
- Remove/directly delete SMS from search results
- One-click batch deletion of queried SMS messages
- One-click export of all SMS messages to CSV file

## Screenshot
![UI](assets/screenshot/ui.jpg)

## Development Environment

- Flutter 3.44.9 (stable)
- Dart 3.12.2
- Gradle 9.1.0
- Android Gradle Plugin 9.0.1
- Kotlin 2.3.20
- compileSdk 36 / minSdk 26
- JDK 17

## Build & Publish

Build the release APK with flutter_distributor:

```bash
dart pub global activate flutter_distributor
flutter_distributor release --name apk
```

Artifacts are output to `dist/`. The APK is signed with the release keystore and packages **arm64-v8a only** (single ABI).

### CI Workflows

| Workflow | Trigger | Flutter Channel | Contents |
| --- | --- | --- | --- |
| `build.yml` | push main (version tags excluded) / opened PR | stable | `dart analyze` + build APK + upload artifact |
| `manual.yml` | manual trigger | beta / master / stable selectable | `dart analyze` + build APK + upload artifact |
| `publish.yml` | version tag (e.g. `1.6.1+250725`) | beta | build APK + create draft Release |

### Build Notes

- `permission_handler` is pinned to `12.0.3`: v13 requires compileSdk 37, which exceeds the Flutter stable template (compileSdk 36) and AGP 9.0.1's supported range.
- Old plugins (e.g. `sms_advanced 1.1.0`, from the AGP 4.1 era) lack a `namespace` and hardcode `compileSdk 31`. The root `android/build.gradle.kts` auto-fills the namespace from `project.group` and raises the compileSdk of legacy library modules to 36.
- Lint tasks are disabled in `android/build.gradle.kts` (see the Call project note): legacy plugin buildscripts pin old AGP versions and crash the lint worker (`AndroidLintWorkAction`) when mixed with root AGP 9.0.1; `extract*Annotations` tasks are replaced with placeholder outputs.
- `kotlin.incremental=false` is set in `android/gradle.properties`: on Windows, Kotlin incremental compilation cannot handle sources (pub cache on the C: drive) and build output (project on the D: drive) on different drives.
- `sms_advanced` applies the Kotlin Gradle Plugin itself; future Flutter versions will reject this, so keep an eye out for an alternative.
- Code quality is guaranteed by `dart analyze` in CI.

## Project Structure

```
Sms
├─android              # Android project configuration
├─assets               # Assets
├─lib                  # Flutter source code
│  └─main.dart         # App entry
├─.github/workflows    # CI workflows
└─dist                 # Build output
```
