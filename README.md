# 非遗小火苗桌宠

使用 Electron 和 HTML/CSS/JavaScript 实现。需要支持桌面窗口的 Windows、macOS 或 Linux 图形会话。

## 项目结构

```text
amazing-pet/
├── package.json
├── package-lock.json
├── main.js
├── index.html
├── style.css
├── renderer.js
├── preload.js
├── start-windows.cmd
├── start-macos.command
└── pet.png              # 已放入处理后的透明桌宠图片
```

`preload.js` 提供受限的桌面交互接口，`renderer.js` 负责页面交互。主进程负责窗口移动和系统菜单。

## 运行

先完整解压项目，文件必须保持在同一文件夹中。这是源代码项目，需要安装 Node.js 24 LTS，不是独立的 exe 安装包。

- Windows：安装 Node.js 后双击 `start-windows.cmd`。首次会安装依赖；失败时窗口会保留报错。
- macOS：安装 Node.js 后，在终端进入本目录执行 `bash start-macos.command`。
- 仅预览：双击 `index.html`，可看到宠物、浮动动画和点击气泡。浏览器无法提供桌面透明窗口、移动系统窗口、置顶或退出应用的系统菜单，这些需要 Electron 启动。

也可以在项目目录手动执行：

```sh
cd amazing-pet
npm ci
npm start
```

需要 Node.js 22.12 或更新版本。初次运行可能下载 Electron 二进制，需要能够访问 GitHub Releases。若 Node.js 24 的云代理环境下载失败，可使用 `NODE_USE_ENV_PROXY=1 npm start`（Bash）。普通本地桌面无需此设置。

项目已包含根据你提供的图片去除棋盘格背景后生成的 `pet.png`，使用真实 Alpha 透明通道。替换形象时，将新的透明 PNG 保存为同名文件即可。

- 左键轻点：显示气泡，3 秒后开始淡出。
- 按住图片拖动：移动整个窗口，超过 5 像素视为拖拽，松手不弹气泡。
- 右键：打开系统菜单，选择“退出”。
- 键盘 Tab 聚焦宠物后，Enter / 空格也可显示气泡。

```sh
npm run check
```

上述命令只检查 JavaScript 语法。透明、置顶、拖动和菜单效果需要在真实桌面手动验证；部分 Linux Wayland 合成器限制窗口定位或置顶，可在 X11 会话下验证。

## 在 GitHub 上使用

源代码同步到 `rds54mbtv5-dotcom/amazing-pet` 的 `main` 分支。

### 下载桌面应用（不需要安装 Node.js）

1. 打开仓库 **Actions → Build desktop pet**。
2. 点击最新一次构建，等待绿色成功状态。
3. 在页面底部 **Artifacts** 下载 Windows x64 或 macOS Apple Silicon 对应的压缩包。
4. 完整解压。Windows 双击内部的 `amazing-pet.exe`；macOS 打开 `amazing-pet.app`。必须保留同目录中的所有资源文件。

这些是未签名的开发构建，操作系统可能要求确认来源；macOS Intel 用户请使用源码启动方式。首次推送后会自动构建，也可通过 **Run workflow** 手动触发。尚未成功的构建不代表应用已经可下载。

### 在 GitHub Pages 网页中预览

1. 在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
2. 在 **Actions → Publish web preview → Run workflow** 选择 `main` 并运行。
3. 成功后从部署记录打开页面链接。

网页支持图片、浮动动画和点击气泡。桌面置顶、拖动整个系统窗口、系统退出菜单需要运行桌面应用。Pages 的可用性取决于仓库可见性和 GitHub 账户方案。
