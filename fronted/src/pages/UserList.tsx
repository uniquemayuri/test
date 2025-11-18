import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Card, CardContent, Avatar, Typography, Box } from '@mui/material';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<Array<{id:number, username:string, avatar_url?:string}>>([]);

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

  return (
    <Box sx={{maxWidth:1000, mx:'auto', mt:3}}>
      <Typography variant="h5" sx={{mb:2}}>ユーザー一覧</Typography>
      <Box sx={{display:'flex', flexWrap:'wrap', gap:2}}>
        {users.map(u => (
          <Box key={u.id} sx={{width:{ xs: '100%', sm: '50%', md: '33.333%' }}}>
            <Card>
              <CardContent sx={{display:'flex', flexDirection:'column', alignItems:'center', gap:1}}>
                {u.avatar_url ? (
                  <Avatar src={u.avatar_url} sx={{width:80, height:80}} />
                ) : (
                  <Avatar sx={{width:80, height:80}} />
                )}
                <Typography>{u.username}</Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default UserList;
