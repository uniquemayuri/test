import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";
import FileList from "./pages/FileList";
import AccountInfo from "./pages/AccountInfo";
import UserList from "./pages/UserList";
import api from "./api/axiosConfig";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home';
import Alert from '@mui/material/Alert';

const HeaderInner: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUsername(null);
        setAvatarUrl(null);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUsername(res.data.username);
        try {
          const info = await api.get('/api/account-info/');
          if (info.data.avatar_filename) {
            const base = (api.defaults.baseURL || 'http://127.0.0.1:8000').replace(/\/$/, '');
            setAvatarUrl(`${base}/uploads/avatars/${info.data.avatar_filename}`);
          } else {
            setAvatarUrl(null);
          }
        } catch (err: any) {
          // 404 is expected if account info not yet created
          if (err.response?.status !== 404) {
            console.error('Error fetching account info:', err);
          }
          setAvatarUrl(null);
        }
      } catch (e) {
        localStorage.removeItem('token');
        setUsername(null);
        setAvatarUrl(null);
      }
    };
    fetchMe();
  }, [refreshKey]);

  const logout = () => {
    localStorage.removeItem('token');
    setUsername(null);
    setAvatarUrl(null);
    setRefreshKey(k => k + 1);
    navigate('/');
  };

  const handleProtectedClick = (e: React.MouseEvent<HTMLButtonElement>, page: string) => {
    if (!username) {
      e.preventDefault();
      setAlertMsg(`${page}にアクセスするにはログインしてください。`);
      setTimeout(() => setAlertMsg(null), 3000);
    }
  };

  const refreshHeader = () => setRefreshKey(k => k + 1);
  (window as any).refreshHeader = refreshHeader;

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar sx={{display:'flex', justifyContent:'space-between'}}>
        <Box sx={{display:'flex', alignItems:'center', gap:2}}>
          <IconButton component={Link as any} to="/" color="inherit" size="large" edge="start">
            <HomeIcon />
          </IconButton>
          <Button color="inherit" onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleProtectedClick(e, 'ファイル')} component={Link as any} to="/files">ファイル</Button>
          <Button color="inherit" onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleProtectedClick(e, 'アップロード')} component={Link as any} to="/upload">アップロード</Button>
          <Button color="inherit" onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleProtectedClick(e, 'アカウント')} component={Link as any} to="/account-info">アカウント</Button>
          <Button color="inherit" onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleProtectedClick(e, 'ユーザー一覧')} component={Link as any} to="/users">ユーザー</Button>
        </Box>

        <Box sx={{display:'flex', alignItems:'center', gap:2}}>
          {avatarUrl ? (
            <Avatar src={avatarUrl} alt={username || undefined} sx={{width:40, height:40}} />
          ) : (
            <Avatar sx={{width:40, height:40}} />
          )}
          {username ? <Typography variant="body1">{username}</Typography> : <Button color="inherit" component={Link as any} to="/">ログイン</Button>}
          {username ? <Button color="inherit" onClick={logout}>ログアウト</Button> : null}
        </Box>
      </Toolbar>
      {alertMsg && (
        <Box sx={{px:2, py:1}}>
          <Alert severity="warning" onClose={() => setAlertMsg(null)}>{alertMsg}</Alert>
        </Box>
      )}
    </AppBar>
  );
};

function App() {
  return (
    <Router>
      <HeaderInner />
      <Box component="main" sx={{p:3, maxWidth:1000, mx:'auto'}}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account-info" element={<AccountInfo />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/files" element={<FileList />} />
          <Route path="/users" element={<UserList />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;
