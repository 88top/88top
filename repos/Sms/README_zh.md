![LOGO](android/app/src/main/res/mipmap-xhdpi/ic_launcher.png)

# 短信清理

简体中文 | [繁體中文](README_zh_TW.md) | [English](README.md)

- 短信清理是Flutter框架编写的在Android上读取、批量删除短信的短信清理工具。
- 虽然UI框架Flutter支持跨平台，但仅实现了Android短信删除功能。

## 功能描述

- 获取短信权限
- 复制短信到剪切板
- 设置/恢复默认短信应用
- 关键字过滤短信信息
- 同号码短信搜索
- 从搜索结果移除/直接删除短信
- 一键批量删除查询结果短信
- 一键导出所有短信到csv文件

## 界面截图
![UI](assets/screenshot/ui.jpg)

## 开发环境

- Flutter 3.44.9 (stable)
- Dart 3.12.2
- Gradle 9.1.0
- Android Gradle Plugin 9.0.1
- Kotlin 2.3.20
- compileSdk 36 / minSdk 26
- JDK 17

## 构建与发布

使用 flutter_distributor 打包 release：

```bash
dart pub global activate flutter_distributor
flutter_distributor release --name apk
```

产物输出到 `dist/` 目录。APK 使用 release 签名，且仅打包 **arm64-v8a** 单 ABI。

### CI 工作流

| 工作流 | 触发时机 | Flutter 渠道 | 内容 |
| --- | --- | --- | --- |
| `build.yml` | push main（版本 tag 除外）/ 新建 PR | stable | `dart analyze` + 构建 APK + 上传 artifact |
| `manual.yml` | 手动触发 | beta / master / stable 可选 | `dart analyze` + 构建 APK + 上传 artifact |
| `publish.yml` | 版本 tag（如 `1.6.1+250725`） | beta | 构建 APK + 创建草稿 Release |

### 构建注意事项

- `permission_handler` 固定在 `12.0.3`：v13 要求 compileSdk 37，超出 Flutter stable 模板（compileSdk 36）与 AGP 9.0.1 的支持范围。
- 老插件（如 `sms_advanced 1.1.0`，AGP 4.1 时代产物）缺少 `namespace` 且写死 `compileSdk 31`，根 `android/build.gradle.kts` 中自动用 `project.group` 补全 namespace，并把旧库模块的 compileSdk 抬升到 36。
- lint 相关任务在 `android/build.gradle.kts` 中被跳过：旧插件的 buildscript 钉老版本 AGP，与根工程 AGP 9.0.1 混载会导致 lint worker（`AndroidLintWorkAction`）崩溃，因此统一禁用 lint 系列任务，并为 `extract*Annotations` 任务生成占位产物。
- `android/gradle.properties` 中设置了 `kotlin.incremental=false`：Windows 上 Kotlin 增量编译无法处理源码（C: 盘 pub 缓存）与构建产物（D: 盘工程）跨盘符的情况。
- `sms_advanced` 插件自身应用了 Kotlin Gradle Plugin，未来版本 Flutter 将拒绝构建，需留意替代方案。
- 代码质量由 CI 中的 `dart analyze` 保证。

## 项目结构

```
Sms
├─android              # Android工程配置
├─assets               # 资源文件目录
├─lib                  # Flutter源代码目录
│  └─main.dart         # APP入口
├─.github/workflows    # CI 工作流
└─dist                 # 构建产物目录
```
