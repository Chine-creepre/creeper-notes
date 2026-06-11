# creeper-notes

`creeper-notes` 是一个基于 Vue 3、TypeScript、Vite 和 Tauri 2 的桌面笔记应用。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Tauri 2
- Rust
- pnpm
- SCSS

## 环境准备

### Node.js

建议使用 Node.js LTS 版本。

```bash
node -v
pnpm -v
```

如果本机未安装 `pnpm`：

```bash
npm install -g pnpm
```

### Rust / Cargo

Tauri 需要 Rust 工具链。

```bash
rustc --version
cargo --version
```

如果命令不存在，需要先安装 Rust：

```text
https://www.rust-lang.org/tools/install
```

Windows 环境还需要安装 Visual Studio Build Tools，并勾选：

```text
Desktop development with C++
```

至少需要包含：

- MSVC
- Windows SDK
- C++ CMake tools for Windows

## 安装依赖

```bash
pnpm install
```

项目使用 SCSS，依赖由 `sass` 提供。

如需手动安装：

```bash
pnpm add -D sass
```

## 开发启动

### Web 开发模式

```bash
pnpm dev
```

### Tauri 桌面开发模式

```bash
pnpm tauri dev
```

或：

```bash
pnpm run tauri dev
```

## 构建

### 构建前端资源

```bash
pnpm build
```

### Windows 安装器

```bash
pnpm build:win
```

产物目录：

```text
src-tauri/target/release/bundle/nsis
```

### macOS 安装器

```bash
pnpm build:mac
```

产物目录：

```text
src-tauri/target/release/bundle/dmg
```

说明：

- Windows 推荐在 Windows 环境构建 `nsis` 安装器。
- macOS 推荐在 macOS 环境构建 `dmg` 安装器。
- 不建议在本地手动配置复杂交叉编译环境。

## 目录说明

```text
creeper-notes/
├─ src/                 # 前端源码
├─ src-tauri/           # Tauri / Rust 源码
├─ public/              # 静态资源
├─ package.json         # 前端依赖和脚本
├─ vite.config.ts       # Vite 配置
└─ README.md            # 项目说明
```

### 前端目录建议

```text
src/
├─ assets/              # 静态资源
├─ components/          # 通用组件
├─ layouts/             # 布局组件
├─ router/              # 路由配置
├─ services/            # 前端服务层，只负责调用 invoke / API
├─ stores/              # Pinia 状态管理
├─ views/               # 页面组件
├─ App.vue
└─ main.ts
```

### 页面目录规范

页面必须使用目录模式。

```text
src/views/
└─ Bootstrap/
   ├─ index.vue         # 页面模板和组件组合
   ├─ index.scss        # 页面样式
   └─ hook.ts           # 页面状态和页面逻辑
```

禁止使用单文件页面命名：

```text
src/views/Bootstrap.vue
src/views/Home.vue
src/views/Settings.vue
```

新增页面时统一使用：

```text
src/views/PageName/
├─ index.vue
├─ index.scss
└─ hook.ts
```

路由中引用页面目录入口：

```ts
component: () => import("@/views/Bootstrap/index.vue")
```

### 页面文件职责

#### index.vue

负责：

- 页面模板
- 组件引用
- 事件绑定
- 状态展示

不负责：

- 复杂业务逻辑
- 数据转换
- 大量状态处理
- Tauri invoke 细节

页面样式必须通过同级 `index.scss` 引入：

```vue
<style lang="scss" scoped src="./index.scss"></style>
```

不允许在页面 `index.vue` 中直接编写大量内联样式。

#### hook.ts

负责：

- 页面状态
- 页面事件
- 页面生命周期
- 页面级数据组装

命名格式：

```ts
export const useBootstrap = () => {
  return {};
};
```

#### index.scss

负责页面样式。

页面样式必须和页面入口同级：

```text
src/views/Bootstrap/
├─ index.vue
├─ index.scss
└─ hook.ts
```

### 命名规范

#### 组件名

组件名必须使用 `h` 前缀。

推荐格式：

```text
HWindowTitleBar
HAppLayout
HNoteList
HBootstrap
```

不推荐：

```text
WindowTitleBar
AppLayout
NoteList
BootstrapView
```

#### class 类名

样式类名必须使用 `h_` 前缀，并使用下划线连接。

推荐格式：

```text
h_bootstrap
h_bootstrap_title
h_window_title_bar
h_window_title_bar_action
```

不允许：

```text
bootstrap-page
window-title-bar
windowTitleBar
h-window-title-bar
```

页面根节点类名建议和页面目录保持一致：

```vue
<template>
  <div class="h_bootstrap"></div>
</template>
```

组件根节点类名建议和组件目录保持一致：

```vue
<template>
  <div class="h_window_title_bar"></div>
</template>
```

### 组件目录规范

复杂组件也使用目录模式。

```text
src/components/
└─ WindowTitleBar/
   ├─ index.vue
   ├─ index.scss
   └─ hook.ts
```

简单组件允许单文件，但需要保持职责单一。

### Tauri 目录建议

```text
src-tauri/src/
├─ commands/            # 暴露给前端 invoke 的命令
├─ database/            # 数据库访问与迁移
├─ file_system/         # 文件系统访问
├─ models/              # Rust 数据模型
└─ lib.rs               # Tauri 应用入口
```

## 前后端职责规范

### 前端职责

- 页面渲染
- 用户交互
- 状态管理
- 调用 Tauri `invoke` 接口
- 不直接操作数据库
- 不直接拼接系统文件路径

### Tauri 职责

- 文件读写
- 数据库读写
- 本地路径校验
- 系统能力调用
- 数据持久化
- 对前端提供稳定的 command 接口

## 代码规范

### TypeScript

- 优先使用显式类型。
- 禁止使用 `any` 逃避类型约束。
- 函数返回值需要明确表达业务语义。
- 禁止使用 `void` 标记函数返回类型。
- 状态数据统一放入 Pinia 或明确的单例服务中。
- 组件只负责视图和交互，不直接承担复杂业务逻辑。

### Vue

- 组件职责保持单一。
- 通用组件放入 `components`。
- 页面级组件放入 `views`。
- 布局组件放入 `layouts`。
- 页面必须使用目录模式：`index.vue`、`index.scss`、`hook.ts`。
- 页面样式必须通过同级 `index.scss` 引入。
- 复杂公共逻辑放入 `stores`，页面复杂逻辑放入页面 `hook.ts`。
- 页面样式类名必须使用 `h_` 前缀和下划线连接。
- 组件名必须使用 `h` 前缀。

### Rust / Tauri

- 前端只通过 `invoke` 调用 Tauri command。
- command 只做参数接收、错误转换和调用领域服务。
- 文件系统逻辑集中在 `file_system`。
- 数据库逻辑集中在 `database`。
- 有状态资源需要集中注册和管理。

## Git 提交规范

提交信息采用 Conventional Commits 风格。

格式：

```text
<type>: <subject>
```

示例：

```text
feat: add custom window title bar
fix: correct tauri bundle identifier
chore: initialize vue router and pinia
docs: update project usage guide
refactor: split note file service
style: adjust title bar layout
build: add windows and mac build scripts
```

### type 说明

| type | 说明 |
|---|---|
| feat | 新增功能 |
| fix | 修复问题 |
| docs | 文档变更 |
| style | 样式调整，不影响逻辑 |
| refactor | 重构，不新增功能、不修复问题 |
| perf | 性能优化 |
| test | 测试相关 |
| build | 构建、依赖、打包相关 |
| ci | CI/CD 相关 |
| chore | 工程化杂项 |
| revert | 回滚提交 |

### 提交要求

- subject 使用英文小写开头。
- subject 不以句号结尾。
- 一个提交只做一类事情。
- 不把格式化、重构、功能开发混在同一个提交里。
- 提交前需要确保本地构建通过。

## 推荐开发流程

```bash
git checkout -b feat/your-feature
pnpm install
pnpm tauri dev
pnpm build
git add .
git commit -m "feat: add your feature"
```

## 常见问题

### cargo metadata program not found

说明 Rust / Cargo 未安装或未加入 PATH。

```bash
cargo --version
```

如果命令不存在，安装 Rust 后重新打开终端。

### bundle identifier 不合法

Tauri `identifier` 只能包含：

- 字母
- 数字
- `-`
- `.`

不能包含 `_`。

推荐格式：

```text
com.creepre.creeper-notes
```

### Windows 打包缺少 link.exe

说明缺少 Visual Studio Build Tools。安装时选择：

```text
Desktop development with C++
```
