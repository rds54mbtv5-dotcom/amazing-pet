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
├── pet-state.js
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

- 左键轻点：开心跳跃，显示气泡，3 秒后开始淡出。
- 按住图片拖动：移动整个窗口，超过 5 像素视为拖拽；拖动时倾斜，松手回弹，不误弹点击气泡。
- 右键：打开系统菜单，选择“退出”。
- 键盘 Tab 聚焦宠物后，Enter / 空格也可显示气泡。

```sh
npm run check
npm test
```

`check` 检查 JavaScript 语法，`test` 验证动作优先级、计时与取消逻辑。透明、置顶、拖动和菜单效果需要在真实桌面手动验证；部分 Linux Wayland 合成器限制窗口定位或置顶，可在 X11 会话下验证。

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

## 8 个核心动作与性格

保持 `pet.png` 原图不变，通过身体变形、SVG 眼睑 / 腮红和挥手叠层表现动作，不替换角色。单张图片没有分层骨骼，因此眨眼使用面部覆盖，挥手使用匹配颜色的小手叠层。

| 动作 | 触发 | 时长 |
| --- | --- | --- |
| 待机呼吸 idle | 默认 | 2.8 秒循环，轻微浮动、缩放与摇晃 |
| 眨眼 blink | 待机时随机每 3–7 秒尝试 | 0.42 秒，25% 概率双眨 |
| 开心 happy | 单击、Enter 或空格 | 0.7 秒，跳跃、回弹、脸红与小星光 |
| 害羞 shy | 悬停 1.5 秒 | 0.8 秒，歪头、摇晃与脸红 |
| 拖动 drag | 按住并移动超过 5 像素 | 持续响应，倾斜角随鼠标移动变化 |
| 落地 land | 拖动结束或取消 | 0.42 秒，压扁再回弹 |
| 打瞌睡 sleep | 无互动 4 分钟 | 闭眼、低频呼吸与 Zzz，触碰唤醒 |
| 打招呼 greet | 启动、学习任务完成 | 1 秒，挥手和轻微摆动 |

`pet-state.js` 集中控制动作优先级：拖动 > 落地 > 开心 > 害羞 > 打招呼 > 眨眼 / 睡眠 > 待机。切换动作会取消旧动作的结束计时，避免旧定时器打断新动作。落地由拖动结束时显式触发。悬停每次进入只触发一次，退出后再进入可重新触发。

90 秒后首次尝试主动打招呼并介绍一条非遗知识，之后每 3 分钟尝试一次；忙于交互、睡眠或页面隐藏时跳过。隐藏页面时暂停自动行为，长时间离开再返回仍保持困倦状态；失焦、指针取消会结束拖动。开启系统“减少动态效果”时，保留表情和提示，减少身体运动。

网页预览也支持在浏览器视口内拖动；浏览器仍不能移动系统窗口。学习任务完成后，可通过 `window.dispatchEvent(new Event('pet:celebrate'))` 触发欢迎庆祝。桌宠不收集学习或鼠标数据，不发送网络请求。
