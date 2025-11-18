import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Container, Box, TextField, Button, Avatar, Typography, CircularProgress } from '@mui/material';

const AccountInfo: React.FC = () => {
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    company: '',
    department: '',
    nickname: '',
    age: '',
    interests: ''
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const fetchAccountInfo = async () => {
    try {
      const response = await api.get('/api/account-info/');
      setFormData(response.data || {});
      if (response.data?.avatar_filename) {
        const base = (api.defaults.baseURL || 'http://127.0.0.1:8000').replace(/\/$/, '');
        setAvatarPreview(`${base}/uploads/avatars/${response.data.avatar_filename}`);
      }
    } catch (error: any) {
      // 404 is expected when user has no account info yet; silently initialize
      if (error.response?.status !== 404) {
        console.error('Error fetching account info:', error);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setAvatarPreview(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return true;
    const form = new FormData();
    form.append('avatar', avatarFile);
    try {
      await api.post('/api/account-info/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('✅ アバターをアップロードしました。');
      setAvatarFile(null);
      return true;
    } catch (err: any) {
      setMessage(`❌ アップロード失敗: ${err.response?.data?.detail || 'エラー'}`);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (avatarFile) {
        const success = await uploadAvatar();
        if (!success) {
          setLoading(false);
          return;
        }
      }

      const data = { ...formData } as any;
      delete data.avatar_filename;
      // Convert age to number if present, validate it's a valid integer
      if (data.age && data.age !== '') {
        const age = parseInt(data.age, 10);
        if (isNaN(age)) {
          setMessage('❌ 年齢は整数で入力してください。');
          setLoading(false);
          return;
        }
        data.age = age;
      } else {
        data.age = null;
      }

      // Use POST so backend will create or update the record
      await api.post('/api/account-info/', data);
      setMessage('✅ アカウント情報を保存しました。');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      const detail = error.response?.data?.detail || error.response?.data || '保存失敗';
      setMessage(`❌ エラー: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{mt:4, p:3, bgcolor:'background.paper', borderRadius:2, boxShadow:1}}>
        <Typography variant="h6" sx={{mb:2}}>アカウント情報の編集</Typography>

        {message && (
          <Box sx={{mb:2, p:1, borderRadius:1, bgcolor:'#f0f0f0'}}>
            <Typography color={message.includes('✅') ? 'success.main' : 'error.main'}>{message}</Typography>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{display:'flex', flexDirection:'column', gap:2}}>
            <Box sx={{textAlign:'center'}}>
              <Typography>アバター</Typography>
              <Box sx={{my:1}}>
                {avatarPreview ? (
                  <Avatar src={avatarPreview} sx={{width:120, height:120, mx:'auto'}} />
                ) : (
                  <Avatar sx={{width:120, height:120, mx:'auto'}} />
                )}
              </Box>
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
            </Box>

            <TextField label="ニックネーム" name="nickname" value={(formData as any).nickname || ''} onChange={handleChange} fullWidth />
            <TextField label="年齢" name="age" value={(formData as any).age || ''} onChange={handleChange} fullWidth type="number" />
            <TextField label="興味" name="interests" value={(formData as any).interests || ''} onChange={handleChange} fullWidth multiline minRows={3} />
            <TextField label="電話番号" name="phone" value={(formData as any).phone || ''} onChange={handleChange} fullWidth />
            <TextField label="住所" name="address" value={(formData as any).address || ''} onChange={handleChange} fullWidth />
            <TextField label="会社" name="company" value={(formData as any).company || ''} onChange={handleChange} fullWidth />
            <TextField label="部署" name="department" value={(formData as any).department || ''} onChange={handleChange} fullWidth />

            <Button type="submit" variant="contained" disabled={loading} fullWidth>
              {loading ? <CircularProgress size={20} color="inherit" /> : '保存'}
            </Button>
          </Box>
        </form>
      </Box>
    </Container>
  );
};

export default AccountInfo;
