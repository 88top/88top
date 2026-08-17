![LOGO](android/app/src/main/res/mipmap-xhdpi/ic_launcher.png)

# 簡訊清理

[简体中文](README_zh.md) | 繁體中文 | [English](README.md)

- 簡訊清理是使用Flutter框架編寫的Android平台上讀取、批量刪除簡訊的清理工具。
- 雖然UI框架Flutter支援跨平台，但僅實現了Android簡訊刪除功能。

## 功能描述

- 獲取簡訊權限
- 複製簡訊到剪貼簿
- 設置/恢復預設簡訊應用
- 關鍵字過濾簡訊信息
- 同號碼簡訊搜索
- 從搜索結果移除/直接刪除簡訊
- 一鍵批量刪除查詢結果簡訊
- 一鍵導出所有簡訊到csv文件

## 界面截圖
![UI](assets/screenshot/ui.jpg)

## 開發環境

- Flutter 3.44.9 (stable)
- Dart 3.12.2
- Gradle 9.1.0
- Android Gradle Plugin 9.0.1
- Kotlin 2.3.20
- compileSdk 36 / minSdk 26
- JDK 17

## 構建與發佈

使用 flutter_distributor 打包 release：

```bash
dart pub global activate flutter_distributor
flutter_distributor release --name apk
```

產物輸出到 `dist/` 目錄。APK 使用 release 簽名，且僅打包 **arm64-v8a** 單 ABI。

### CI 工作流

| 工作流 | 觸發時機 | Flutter 渠道 | 內容 |
| --- | --- | --- | --- |
| `build.yml` | push main（版本 tag 除外）/ 新建 PR | stable | `dart analyze` + 構建 APK + 上傳 artifact |
| `manual.yml` | 手動觸發 | beta / master / stable 可選 | `dart analyze` + 構建 APK + 上傳 artifact |
| `publish.yml` | 版本 tag（如 `1.6.1+250725`） | beta | 構建 APK + 建立草稿 Release |

### 構建注意事項

- `permission_handler` 固定在 `12.0.3`：v13 要求 compileSdk 37，超出 Flutter stable 模板（compileSdk 36）與 AGP 9.0.1 的支援範圍。
- 老外掛（如 `sms_advanced 1.1.0`，AGP 4.1 時代產物）缺少 `namespace` 且寫死 `compileSdk 31`，根 `android/build.gradle.kts` 中自動用 `project.group` 補全 namespace，並把舊庫模組的 compileSdk 抬升到 36。
- lint 相關任務在 `android/build.gradle.kts` 中被跳過：舊外掛的 buildscript 釘老版本 AGP，與根工程 AGP 9.0.1 混載會導致 lint worker（`AndroidLintWorkAction`）崩潰，因此統一禁用 lint 系列任務，並為 `extract*Annotations` 任務生成佔位產物。
- `android/gradle.properties` 中設定了 `kotlin.incremental=false`：Windows 上 Kotlin 增量編譯無法處理原始碼（C: 碟 pub 快取）與構建產物（D: 碟工程）跨磁碟的情況。
- `sms_advanced` 外掛自身應用了 Kotlin Gradle Plugin，未來版本 Flutter 將拒絕構建，需留意替代方案。
- 程式碼品質由 CI 中的 `dart analyze` 保證。

## 專案結構

```
Sms
├─android              # Android工程配置
├─assets               # 資源檔案目錄
├─lib                  # Flutter原始碼目錄
│  └─main.dart         # APP入口
├─.github/workflows    # CI 工作流
└─dist                 # 構建產物目錄
```
