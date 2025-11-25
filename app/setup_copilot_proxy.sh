#!/usr/bin/env bash
# setup_copilot_proxy.sh
# 一键为 WSL/Linux + VS Code 配置/检测 GitHub Copilot 代理，并执行连通性自检。
# 使用方法：
#   chmod +x setup_copilot_proxy.sh
#   ./setup_copilot_proxy.sh [-p http://HOST:PORT] [-u USERNAME] [-w PASSWORD] [--apply] [--no-apply]
# 默认代理：http://138.212.251.225:3128

set -euo pipefail

PROXY_DEFAULT="http://138.212.251.225:3128"
PROXY_URL="${PROXY_DEFAULT}"
PROXY_USER=""
PROXY_PASS=""
APPLY=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--proxy)
      PROXY_URL="$2"; shift 2;;
    -u|--user)
      PROXY_USER="$2"; shift 2;;
    -w|--pass)
      PROXY_PASS="$2"; shift 2;;
    --apply)
      APPLY=1; shift;;
    --no-apply)
      APPLY=0; shift;;
    -h|--help)
      sed -n '1,40p' "$0"; exit 0;;
    *) echo "未知参数: $1"; exit 1;;
  esac
done

# 如果提供了用户名密码，拼接认证信息到 URL（仅当URL中未含有认证）
if [[ -n "$PROXY_USER" ]] && [[ -n "$PROXY_PASS" ]]; then
  if [[ "$PROXY_URL" != http://* ]]; then
    echo "警告: Copilot 仅支持 http 代理。当前: $PROXY_URL" >&2
  fi
  proto="${PROXY_URL%%://*}://"; rest="${PROXY_URL#*://}"
  if [[ "$rest" != *"@"* ]]; then
    PROXY_URL="${proto}${PROXY_USER}:${PROXY_PASS}@${rest}"
  fi
fi

print_section(){
  echo -e "\n==================== $1 ====================";
}

apply_file(){
  local path="$1"; shift
  local content="$*"
  mkdir -p "$(dirname "$path")"
  printf "%s\n" "$content" > "$path"
  echo "写入: $path"
}

append_line_once(){
  local file="$1"; local line="$2"
  mkdir -p "$(dirname "$file")"
  touch "$file"
  grep -Fqx "$line" "$file" || echo "$line" >> "$file"
}

print_section "配置参数"
cat <<EOF
代理URL  : $PROXY_URL
应用配置 : $( [[ $APPLY -eq 1 ]] && echo 启用 || echo 仅检测 )
WSL/Linux: $(uname -a)
HOME     : $HOME
EOF

# 1) 环境变量（HTTP_PROXY/HTTPS_PROXY/NO_PROXY）
print_section "环境变量设置 (~/.bashrc)"
BASHRC="$HOME/.bashrc"
append_line_once "$BASHRC" "export HTTP_PROXY='$PROXY_URL'"
append_line_once "$BASHRC" "export HTTPS_PROXY='$PROXY_URL'"
append_line_once "$BASHRC" "export NO_PROXY='localhost,127.0.0.1,::1'"

echo "已更新 $BASHRC (追加)。重新登录或运行: source ~/.bashrc"

# 2) wget 配置（用户级）
print_section "wget 配置 (~/.wgetrc)"
wgetrc_path="$HOME/.wgetrc"
apply_file "$wgetrc_path" "http_proxy=$PROXY_URL
https_proxy=$PROXY_URL"

# 3) apt 配置（用户提示，系统需sudo）
print_section "apt 配置提示 (/etc/apt/apt.conf)"
cat <<APT
建议写入（需sudo）:
Acquire::http::proxy \"$PROXY_URL\";
Acquire::https::proxy \"$PROXY_URL\";
APT

# 4) Docker systemd 代理（提示）
print_section "Docker 代理提示 (/etc/systemd/system/docker.service.d/http-proxy.conf)"
cat <<DOCKER
[Service]
Environment=\"HTTP_PROXY=$PROXY_URL/\" \"HTTPS_PROXY=$PROXY_URL/\"
# 执行:
# sudo mkdir -p /etc/systemd/system/docker.service.d
# echo -e "[Service]\nEnvironment=\"HTTP_PROXY=$PROXY_URL/\" \"HTTPS_PROXY=$PROXY_URL/\"" | sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf
# sudo systemctl daemon-reload && sudo systemctl restart docker
DOCKER

# 5) VS Code 远程 (WSL) settings.json
print_section "VS Code (WSL) 设置 (~/.vscode-server/data/User/settings.json)"
vscode_remote_settings="$HOME/.vscode-server/data/User/settings.json"
# 构造JSON（保持幂等）
json_content=$(cat <<JSON
{
  "http.proxy": "$PROXY_URL",
  "http.proxySupport": "on",
  "http.proxyStrictSSL": false,
  "remote.extensionKind": {
    "GitHub.copilot": ["ui"],
    "GitHub.copilot-chat": ["ui"]
  }
}
JSON
)
# 合并策略：简单覆盖（如果用户已有其它设置，可手动合并）
apply_file "$vscode_remote_settings" "$json_content"

echo "提示：如果你也在 Windows 侧使用 VS Code，本地用户设置路径通常为："
echo "  Windows: %APPDATA%/Code/User/settings.json"
echo "  Linux  : ~/.config/Code/User/settings.json"

# 6) 连通性自检（curl）
print_section "连通性自检 (curl)"
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
  # 使用代理变量进行访问
  if curl -sS -m 15 -I "$ep" ; then
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
可能原因：
 - 代理拒绝 CONNECT 或未允许上述域名（403/隧道失败）。
 - 需要代理认证但未正确传递（在 -u/-w 参数或 PROXY_URL 中填写）。
 - 公司防火墙未放行 *.githubcopilot.com / api.github.com / copilot-proxy.githubusercontent.com。

建议：
 - 确认代理采用 http 协议（而非 https/socks）。
 - 让 IT 放行相关域名与 443/TLS。 
 - 若仅在 WSL 失败，已启用 remote.extensionKind=ui 以绕过 WSL 侧网络限制；如仍失败，尝试在 Windows 本机网络环境测试。
NOTE
fi

print_section "完成"
echo "如需回滚，在 ~/.bashrc 删除 HTTP_PROXY/HTTPS_PROXY/NO_PROXY 行，并清理 ~/.wgetrc 与 WSL settings.json 中的代理设置。"
