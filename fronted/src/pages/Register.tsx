import React, { useState } from "react";
import { TextField, Button, Container, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      alert("全ての項目を入力してください。");
      return;
    }
    if (password.length < 8) {
      alert("パスワードは8文字以上で入力してください。");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      alert("パスワードは72バイト以下で入力してください。");
      return;
    }

    try {
      await api.post("/auth/register", {
        username,
        email,
        password
      });
      // 自动登录：注册成功后调用登录接口并保存 token
      const loginRes = await api.post("/auth/login", { email, password });
      localStorage.setItem('token', loginRes.data.access_token);
      if ((window as any).refreshHeader) (window as any).refreshHeader();
      alert("登録が完了し、ログインしました。");
      navigate('/upload');
    } catch (error: any) {
      const detail = error.response?.data?.detail || "エラーが発生しました";
      let msg = "登録に失敗しました。";
      if (detail === "Email already registered") msg = "このメールアドレスは既に登録されています。";
      else if (detail === "Password too long (max 72 bytes)") msg = "パスワードは72バイト以下で入力してください。";
      else if (detail) msg = `エラー: ${detail}`;
      alert(msg);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{mt:6, display:'flex', flexDirection:'column', gap:2}}>
        <Typography variant="h5">新規登録</Typography>
        <TextField label="メールアドレス" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="ユーザー名" fullWidth value={username} onChange={(e) => setUsername(e.target.value)} />
        <TextField label="パスワード(8文字以上)" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
        <Box>
          <Button variant="contained" onClick={handleRegister}>登録</Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;