
#!/usr/bin/env bash
set -euo pipefail

# === 配置区（如需） ===
# 如公司网络需要代理，取消下面两行注释并填写代理地址：
# git config --global http.proxy http://proxy.company.com:8080
# git config --global https.proxy http://proxy.company.com:8080

REMOTE_URL="https://github.com/uniquemayuri/test"
DEFAULT_BRANCH="main"  # GitHub 默认 main
COMMIT_MSG="${1:-chore: update project}"

# 检查是否在项目目录
if [ ! -d . ]; then
  echo "❌ 请在你的项目根目录运行此脚本"
  exit 1
fi

# 建议的 .gitignore（仅在不存在时创建）
create_gitignore_if_absent() {
  if [ ! -f .gitignore ]; then
    cat > .gitignore <<'EOF'
# Python/FastAPI
__pycache__/
*.pyc
.venv/
venv/
.env
*.sqlite3

# Node/React
node_modules/
dist/
build/
.env
*.log

# Docker
*.pid
docker-compose.override.yml

# VSCode
.vscode/
.history/

# OS
.DS_Store
Thumbs.db
EOF
    echo "🧩 已创建 .gitignore"
  fi
}

# 初始化或确认 Git 仓库
ensure_git_repo() {
  if [ ! -d .git ]; then
    echo "🔧 未检测到 .git，正在初始化仓库..."
    git init
    # 设置默认分支为 main（避免 master）
    git symbolic-ref HEAD refs/heads/${DEFAULT_BRANCH} 2>/dev/null || true
  else
    echo "✅ 已检测到 Git 仓库"
  fi
}

# 确认用户身份（全局一次即可）
ensure_git_identity() {
  NAME=$(git config --global user.name || true)
  EMAIL=$(git config --global user.email || true)
  if [ -z "$NAME" ] || [ -z "$EMAIL" ]; then
    echo "👤 未配置 git 用户信息，先进行配置（你可稍后修改）："
    git config --global user.name "${USER:-YourName}"
    git config --global user.email "${USER:-yourname}@example.com"
    echo "   已暂设 user.name/user.email，可用 git config --global 修改。"
  fi
}

# 设定远程 origin
ensure_remote_origin() {
  local current_url
  current_url=$(git remote get-url origin 2>/dev/null || true)
  if [ -z "$current_url" ]; then
    echo "🌐 未检测到远程 origin，正在添加：${REMOTE_URL}"
    git remote add origin "${REMOTE_URL}"
  else
    if [ "$current_url" != "$REMOTE_URL" ]; then
      echo "🔁 远程 origin 已存在但 URL 不同："
      echo "    当前：$current_url"
      echo "    目标：$REMOTE_URL"
      echo "    正在更新为目标 URL..."
      git remote set-url origin "${REMOTE_URL}"
    else
      echo "✅ 远程 origin 已正确设置为：${REMOTE_URL}"
    fi
  fi
}

# 确认当前分支为 main（如无则创建）
ensure_main_branch() {
  local branch
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [ -z "$branch" ] || [ "$branch" = "HEAD" ]; then
    # 空仓库或游离 HEAD，确保有 main 分支
    git checkout -B "${DEFAULT_BRANCH}"
  elif [ "$branch" != "${DEFAULT_BRANCH}" ]; then
    echo "🔀 当前分支为 ${branch}，将切换/重命名为 ${DEFAULT_BRANCH}"
    git branch -M "${DEFAULT_BRANCH}"
  else
    echo "✅ 当前分支：${DEFAULT_BRANCH}"
  fi
}

# 尝试拉取远程（避免冲突，若远程为空会报错但不影响）
safe_pull_rebase() {
  echo "⬇️ 正在拉取远程 ${DEFAULT_BRANCH}（rebase）..."
  if ! git fetch origin; then
    echo "⚠️ fetch 失败（可能远程为空或网络受限），跳过。"
    return 0
  fi
  if git ls-remote --heads origin "${DEFAULT_BRANCH}" >/dev/null 2>&1; then
    if ! git pull origin "${DEFAULT_BRANCH}" --rebase; then
      echo "⚠️ pull 失败（可能有冲突或远程为空），你可稍后手动处理。"
    fi
  else
    echo "ℹ️ 远程尚无分支 ${DEFAULT_BRANCH}，将进行首次推送。"
  fi
}

# 添加 & 提交
add_and_commit() {
  create_gitignore_if_absent
  echo "➕ 添加所有变更..."
  git add .
  # 如果无变更，跳过提交
  if git diff --cached --quiet; then
    echo "ℹ️ 暂无新增变更需要提交。"
  else
    echo "📝 提交：${COMMIT_MSG}"
    git commit -m "${COMMIT_MSG}"
  fi
}

# 推送
push_main() {
  echo "🚀 推送到远程 ${DEFAULT_BRANCH}..."
  # 设置上游（首次）或普通推送（后续）
  if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
    git push -u origin "${DEFAULT_BRANCH}"
  else
    git push origin "${DEFAULT_BRANCH}"
  fi
  echo "✅ 推送完成！"
  echo
  echo "�� 如果你使用 HTTPS，首次推送会要求输入 GitHub 凭证："
  echo "    - 用户名：你的 GitHub 用户名"
  echo "    - 密码：GitHub Personal Access Token（PAT）"
  echo "      生成位置：GitHub → Settings → Developer settings → Personal access tokens"
  echo "      选 repo 权限，复制 Token 在密码处粘贴。"
  echo
  echo "🔐 若公司网络对 HTTPS 受限，建议改用 SSH："
  echo "    1) ssh-keygen -t ed25519 -C \"your_email@example.com\""
  echo "    2) 将 ~/.ssh/id_ed25519.pub 添加到 GitHub"
  echo "    3) git remote set-url origin git@github.com:uniquemayuri/test.git"
}

# === 主流程 ===
ensure_git_repo
ensure_git_identity
ensure_remote_origin
ensure_main_branch
safe_pull_rebase
add_and_commit
push_main
