#!/usr/bin/env bash
# cleanup_copilot_proxy.sh
# 一键清理 WSL/Linux + VS Code 的代理配置，并用直连方式重新测试 Copilot 端点。
# 用法：
#   chmod +x cleanup_copilot_proxy.sh
#   ./cleanup_copilot_proxy.sh [--keep-ui] [--remove-ui]
# 说明：
#   --keep-ui   保留 remote.extensionKind=ui（默认）。
#   --remove-ui 移除 remote.extensionKind 设置，让扩展在 WSL 侧运行。

set -euo pipefail

KEEP_UI=1
while [[ $# -gt 0 ]]; do
  case "$1" in
    --keep-ui)   KEEP_UI=1; shift;;
    --remove-ui) KEEP_UI=0; shift;;
    -h|--help)   sed -n '1,40p' "$0"; exit 0;;
    *) echo "未知参数: $1"; exit 1;;
  esac
done

print_section(){ echo -e "\n==================== $1 ===================="; }

backup_file(){
  local f="$1"
  if [[ -f "$f" ]]; then
    local ts=$(date +%Y%m%d-%H%M%S)
    cp "$f" "$f.bak.$ts"
    echo "已备份: $f -> $f.bak.$ts"
  fi
}

remove_lines(){
  local f="$1"; shift
  [[ -f "$f" ]] || return 0
  local tmp="$(mktemp)"
  cp "$f" "$tmp"
  for pat in "$@"; do
    sed -i "/$pat/d" "$tmp"
  done
  mv "$tmp" "$f"
}

print_section "当前环境"
uname -a || true
echo "HOME: $HOME"

# 1) 环境变量：临时清除
print_section "取消当前会话代理环境变量"
unset HTTP_PROXY HTTPS_PROXY NO_PROXY || true

echo "HTTP_PROXY/HTTPS_PROXY/NO_PROXY 已取消（当前会话）。"

# 2) ~/.bashrc 中移除代理行
print_section "清理 ~/.bashrc 代理设置"
BASHRC="$HOME/.bashrc"
backup_file "$BASHRC"
remove_lines "$BASHRC" \
  '^export[[:space:]]+HTTP_PROXY=' \
  '^export[[:space:]]+HTTPS_PROXY=' \
  '^export[[:space:]]+NO_PROXY='

echo "已清理 ~/.bashrc 中的代理行。执行: source ~/.bashrc 使其生效。"

# 3) 清理 ~/.wgetrc
print_section "清理 ~/.wgetrc"
WGETRC="$HOME/.wgetrc"
backup_file "$WGETRC"
remove_lines "$WGETRC" \
  '^http_proxy=' \
  '^https_proxy=' \
  '^proxy_user=' \
  '^proxy_password='

echo "已清理 ~/.wgetrc。"

# 4) VS Code WSL 远程 settings.json 处理
print_section "清理 VS Code (WSL) settings.json"
VSCODE_SETTINGS="$HOME/.vscode-server/data/User/settings.json"
backup_file "$VSCODE_SETTINGS"
# 若文件不存在，创建空 JSON
mkdir -p "$(dirname "$VSCODE_SETTINGS")"
[[ -f "$VSCODE_SETTINGS" ]] || echo '{}' > "$VSCODE_SETTINGS"

# 读取现有 JSON，做简易行级清理（避免引入 jq 依赖）
TMP_JSON="$(mktemp)"
cp "$VSCODE_SETTINGS" "$TMP_JSON"
# 删除 http.proxy、http.proxySupport、http.proxyStrictSSL
sed -i '/"http.proxy"[[:space:]]*:/d' "$TMP_JSON"
sed -i '/"http.proxySupport"[[:space:]]*:/d' "$TMP_JSON"
sed -i '/"http.proxyStrictSSL"[[:space:]]*:/d' "$TMP_JSON"

# remote.extensionKind：根据 KEEP_UI 决定保留或移除
if [[ $KEEP_UI -eq 1 ]]; then
  # 注入/覆盖为 ui（利于绕过 WSL 网络限制）
  cat > "$TMP_JSON" <<JSON
{
  "remote.extensionKind": {
    "GitHub.copilot": ["ui"],
    "GitHub.copilot-chat": ["ui"]
  }
}
JSON
  echo "已设置 remote.extensionKind=ui（保留）。"
else
  sed -i '/"remote.extensionKind"[[:space:]]*:/d' "$TMP_JSON"
  echo "已移除 remote.extensionKind 设置。"
fi

mv "$TMP_JSON" "$VSCODE_SETTINGS"
echo "写入: $VSCODE_SETTINGS"

# 5) 直连连通性自检
print_section "直连连通性自检 (不使用代理)"
endpoints=(
  "https://github.com/login"
  "https://api.github.com/_ping"
  "https://copilot-proxy.githubusercontent.com/_ping"
  "https://api.githubcopilot.com/_ping"
  "https://copilot-telemetry.githubusercontent.com/_ping"
)

ok=0; fail=0
for ep in "${endpoints[@]}"; do
  echo "测试: $ep"
  if curl -sS -m 20 -I "$ep" ; then
    echo "OK: $ep"; ok=$((ok+1))
  else
    echo "FAILED: $ep"; fail=$((fail+1))
  fi
  echo "---"
done

print_section "结果汇总"
echo "成功: $ok, 失败: $fail"
if [[ $fail -gt 0 ]]; then
  cat <<NOTE
仍有失败：说明当前网络无法直连这些域名。
 - 如果 Windows 能直连，请保留 --keep-ui（默认）让 Copilot 在 Windows UI 侧运行。
 - 如果 Windows 也不能直连，只能走公司代理，请返回方案 A（让 IT 放行 CONNECT + 域名 allowlist）。
NOTE
fi

print_section "完成"
echo "已清理环境变量、wget、VS Code WSL 设置中的代理。建议重启 VS Code，并测试 Copilot Chat。"
