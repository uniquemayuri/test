import React, { useState } from "react";
import { TextField, Button, Container, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [debugMode, setDebugMode] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください。");
      return;
    }
    try {
      if (debugMode) console.log("🔍 [DEBUG] Starting login attempt:", { email });
      
      // Clear any stale token before login attempt
      localStorage.removeItem("token");
      if (debugMode) console.log("🔍 [DEBUG] Cleared old token from localStorage");
      
      if (debugMode) console.log("🔍 [DEBUG] Sending POST /auth/login:", { email, password: "***" });
      
      const res = await api.post<LoginResponse>("/auth/login", {
        email,
        password
      });
      
      if (debugMode) console.log("🔍 [DEBUG] Login response:", res.status, res.data);
      
      localStorage.setItem("token", res.data.access_token);
      if (debugMode) console.log("🔍 [DEBUG] Token saved to localStorage");
      
      // Refresh header to show avatar/username
      if ((window as any).refreshHeader) {
        (window as any).refreshHeader();
      }
      alert("ログインに成功しました。");
      navigate("/upload");
    } catch (err: any) {
      const detail = err.response?.data?.detail || "不明なエラー";
      const status = err.response?.status || "不明";
      const fullErr = JSON.stringify(err, null, 2);
      
      console.error("❌ [DEBUG] Login error:", { status, detail, err });
      if (debugMode) {
        console.error("Full error object:", fullErr);
        alert(`ログイン失敗\n\nStatus: ${status}\nDetail: ${detail}\n\nSee console for full error.`);
      } else {
        alert(`ログイン失敗 (${status}): ${detail}`);
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{mt:6, display:'flex', flexDirection:'column', gap:2}}>
        <Typography variant="h5">ログイン</Typography>
        <TextField
          label="メールアドレス"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="パスワード"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Box sx={{display:'flex', gap:2}}>
          <Button variant="contained" onClick={handleLogin}>ログイン</Button>
          <Button variant="outlined" onClick={() => navigate('/register')}>新規登録</Button>
        </Box>
        <Box sx={{display:'flex', gap:1, alignItems:'center'}}>
          <input type="checkbox" checked={debugMode} onChange={(e) => setDebugMode(e.target.checked)} />
          <Typography variant="caption">デバッグモード（Fキーを押してコンソール確認）</Typography>
        </Box>
        <Typography variant="caption" sx={{color:'#666', mt:2}}>
          テスト用: test@test.com / test123456
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;