import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Card, CardContent, Avatar, Typography, Box, Collapse, CircularProgress } from '@mui/material';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<Array<{id:number, username:string, avatar_url?:string}>>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, any>>({});
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/account-info/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    // 如果已经有 details 则不重复请求
    if (details[id]) return;

    try {
      setLoadingId(id);
      const data = await fetchUserDetails(api, id);
      setDetails(prev => ({ ...prev, [id]: data }));
    } catch (err) {
      // 如果 404 或其他错误，保留空结果以显示“信息がありません。”
      console.error('Failed to fetch user details', err);
      setDetails(prev => ({ ...prev, [id]: null }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Box sx={{maxWidth:1000, mx:'auto', mt:3}}>
      <Typography variant="h5" sx={{mb:2}}>ユーザー一覧</Typography>
      <Box sx={{display:'flex', flexWrap:'wrap', gap:2}}>
        {users.map(u => (
          <Box key={u.id} sx={{width:{ xs: '100%', sm: '50%', md: '33.333%' }}}>
            <Card>
              <CardContent sx={{display:'flex', flexDirection:'column', alignItems:'center', gap:1}}>
                <Box sx={{position:'relative'}}>
                  {u.avatar_url ? (
                    <Avatar src={u.avatar_url} sx={{width:80, height:80, cursor:'pointer'}} onClick={() => handleToggle(u.id)} />
                  ) : (
                    <Avatar sx={{width:80, height:80, cursor:'pointer'}} onClick={() => handleToggle(u.id)} />
                  )}
                </Box>
                <Typography>{u.username}</Typography>

                <Collapse in={expandedId === u.id} timeout="auto" unmountOnExit sx={{width:'100%', mt:1}}>
                  <Box sx={{p:2, bgcolor:'#fafafa', borderRadius:1}}>
                    {loadingId === u.id ? (
                      <Box sx={{display:'flex', justifyContent:'center'}}><CircularProgress size={24} /></Box>
                    ) : details[u.id] ? (
                      <Box>
                        <Typography variant="subtitle1">{details[u.id].nickname || '（未設定）'}</Typography>
                        <Typography variant="body2">興味: {details[u.id].interests || '—'}</Typography>
                        <Typography variant="body2">年齢: {details[u.id].age ?? '—'}</Typography>
                        <Typography variant="body2">会社: {details[u.id].company || '—'}</Typography>
                        <Typography variant="body2">部署: {details[u.id].department || '—'}</Typography>
                        <Typography variant="body2">電話: {details[u.id].phone || '—'}</Typography>
                        <Typography variant="body2">住所: {details[u.id].address || '—'}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">情報がありません。</Typography>
                    )}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default UserList;

async function fetchUserDetails(apiInstance: typeof api, id: number) {
  const res = await apiInstance.get(`/api/account-info/${id}`);
  return res.data;
}
