import React, { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import {
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Box,
  Avatar,
  ListItemAvatar,
} from "@mui/material";

interface FileItem {
  id: number;
  filename: string;
  path: string;
  file_size?: number;
  file_type?: string | null;
  created_at?: string | null;
}

const formatBytes = (bytes?: number) => {
  if (!bytes && bytes !== 0) return "-";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const extFromName = (name: string) => {
  const m = name.split('.');
  return m.length > 1 ? m[m.length - 1].toLowerCase() : '';
};

const iconForFile = (filename: string, fileType?: string | null) => {
  const ext = extFromName(filename);
  if (fileType?.startsWith('image/') || ['png','jpg','jpeg','gif','webp'].includes(ext)) return '🖼️';
  if (['pdf'].includes(ext)) return '📄';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return '🗜️';
  if (['xls','xlsx','csv'].includes(ext)) return '📊';
  if (['doc','docx'].includes(ext)) return '📝';
  return '📁';
};

const FileList: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
      const res = await api.get("/upload/list");
      setFiles(res.data.files || []);
    };
    fetchFiles();
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        アップロードしたファイル
      </Typography>
      <List>
        {files.map((file) => (
          <ListItem
            key={file.id}
            secondaryAction={
              <Button
                variant="outlined"
                href={`http://127.0.0.1:8000${file.path}?token=${localStorage.getItem("token")}`}
              >
                ダウンロード
              </Button>
            }
          >
            <ListItemAvatar>
              <Avatar>{iconForFile(file.filename, file.file_type)}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={file.filename}
              secondary={`${formatBytes(file.file_size)} ・ ${file.created_at ? new Date(file.created_at).toLocaleString() : '-'}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default FileList;