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

 const handleLogin = async () => {
  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してください。");
    return;
  }
  try {
    localStorage.removeItem("token");
    const res = await api.post<LoginResponse>("/auth/login", {
      email,
      password
    });
    localStorage.setItem("token", res.data.access_token);
    if ((window as any).refreshHeader) {
      (window as any).refreshHeader();
    }
    alert("ログイン成功しました。");
    navigate("/upload");
  } catch (err: any) {
    const detail = err.response?.data?.detail || "不明なエラー";
    const status = err.response?.status || "不明";
    let msg = "ログイン失敗";
    if (detail === "Incorrect password") msg = "パスワードが間違っています。";
    else if (detail === "User not found") msg = "ユーザーが見つかりません。";
    else if (status === 401) msg = "認証に失敗しました。";
    else if (status === 404) msg = "ユーザーが見つかりません。";
    else if (detail) msg = `エラー: ${detail}`;
    alert(msg);
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
        
      </Box>
    </Container>
  );
};

export default Login;