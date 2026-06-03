# GitHub Pages 部署指南

## 部署前准备

### 1. 确认项目文件
确保你的项目目录包含以下文件：
```
test-repo-mcp-new/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── game.js         # 游戏逻辑
├── .nojekyll           # GitHub Pages配置（重要！）
└── README.md           # 项目说明
```

**注意**：`.nojekyll` 文件必须存在，否则 GitHub Pages 会使用 Jekyll 构建，可能导致路径错误。

---

## 部署方法一：使用 GitHub 网页界面（推荐）

### 步骤 1：上传代码到 GitHub 仓库

1. 登录 GitHub，创建或打开你的仓库 `test-repo-mcp-new`
2. 点击「Add file」→ 「Upload files」
3. 将所有项目文件拖拽到上传区域
4. 在「Commit changes」中填写提交信息，如「Initial commit - 2048游戏」
5. 点击「Commit changes」

### 步骤 2：启用 GitHub Pages

1. 在仓库页面，点击右上角的「Settings」
2. 在左侧菜单中找到「Pages」（在「Code and automation」分类下）
3. 在「Build and deployment」→ 「Branch」下：
   - 选择分支：`main`（或 `master`，取决于你的默认分支）
   - 选择文件夹：`/ (root)`
4. 点击「Save」
5. 等待 1-2 分钟，页面会自动刷新，显示部署状态

### 步骤 3：访问你的游戏

部署成功后，页面会显示：
```
Your site is live at https://<你的用户名>.github.io/test-repo-mcp-new/
```

点击链接即可访问！

---

## 部署方法二：使用 Git 命令行

### 前置条件
- 已安装 Git
- 已有 GitHub 账户

### 步骤 1：初始化 Git 仓库

```powershell
# 进入项目目录
cd c:\Users\Administrator\Desktop\0603\test-repo-mcp-new

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交文件
git commit -m "Initial commit - 2048游戏"
```

### 步骤 2：连接到 GitHub 仓库

```powershell
# 添加远程仓库（替换为你的用户名）
git remote add origin https://github.com/<你的用户名>/test-repo-mcp-new.git

# 推送到 main 分支
git branch -M main
git push -u origin main
```

### 步骤 3：启用 GitHub Pages

按照「方法一」的「步骤 2」操作。

---

## 部署方法三：使用 GitHub Desktop

如果你喜欢图形界面工具：

1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)
2. 打开 GitHub Desktop，选择「File」→ 「Add Local Repository」
3. 选择项目目录 `test-repo-mcp-new`
4. 填写提交信息，点击「Commit to main」
5. 点击「Publish repository」将代码推送到 GitHub
6. 按照「方法一」的「步骤 2」启用 GitHub Pages

---

## 验证部署是否成功

### 检查清单

- [ ] 游戏页面正常加载
- [ ] 所有图片、样式、脚本正确加载
- [ ] 4×4 网格布局正常，方块不飘出
- [ ] 主题切换功能正常
- [ ] 本地存储（最高分、排行榜）正常工作
- [ ] 移动端访问正常

### 常见问题排查

**问题 1：样式不显示，页面乱码**
- 检查 `css/style.css` 路径是否正确
- 确认 `.nojekyll` 文件存在

**问题 2：JavaScript 不工作**
- 打开浏览器控制台（F12）查看错误信息
- 确认 `js/game.js` 文件已正确上传

**问题 3：本地存储不生效**
- GitHub Pages 域名 `github.io` 支持 localStorage
- 检查浏览器是否阻止了第三方数据

---

## 自定义域名（可选）

如果你想使用自己的域名：

1. 在项目根目录创建文件 `CNAME`（无后缀）
2. 在文件中写入你的域名，如：`2048.yourdomain.com`
3. 提交并推送到 GitHub
4. 在你的域名 DNS 提供商处添加 CNAME 记录：
   - 主机记录：`2048`
   - 记录值：`<你的用户名>.github.io`
5. 在 GitHub Pages 设置中填写你的自定义域名

---

## 更新游戏

当你修改了代码后：

```powershell
# 查看修改
git status

# 添加修改的文件
git add .

# 提交修改
git commit -m "描述你的修改"

# 推送到 GitHub
git push
```

GitHub Pages 会自动重新部署，通常 1-2 分钟内生效。

---

## 快速部署脚本（PowerShell）

如果你使用 Windows，可以创建以下脚本快速部署：

```powershell
# deploy.ps1
Write-Host "=== 2048游戏部署脚本 ===" -ForegroundColor Green

# 检查是否在正确的目录
if (-not (Test-Path "index.html")) {
    Write-Host "错误：请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

# 提交并推送
git add .
git commit -m "更新2048游戏"
git push

Write-Host "`n代码已推送到GitHub！" -ForegroundColor Green
Write-Host "请在仓库设置中启用GitHub Pages" -ForegroundColor Yellow
```

使用方法：
```powershell
.\deploy.ps1
```

---

## 参考链接

- [GitHub Pages 官方文档](https://pages.github.com/)
- [GitHub Pages 配置指南](https://docs.github.com/cn/pages)

---

**部署完成后，你的2048游戏就可以在互联网上访问了！** 🎮