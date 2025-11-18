import React, { useState, useRef } from "react";
import { Button, Container, LinearProgress, Box, Paper, Typography } from "@mui/material";
import api from "../api/axiosConfig";
import type { AxiosRequestConfig, AxiosProgressEvent } from "axios";
import { useNavigate } from "react-router-dom"; // ✅ 添加这一行

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const navigate = useNavigate(); // ✅ 获取 navigate
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async () => {
    if (!file) return alert("ファイルを選択してください。");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const config: AxiosRequestConfig = {
        // 不要手动设置 Content-Type —— 浏览器会为 FormData 自动添加正确的 boundary
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      };

      await api.post("/upload/", formData, config);
      alert("ファイルのアップロードに成功しました。");
      setProgress(0);
    } catch (err) {
      alert("ファイルのアップロードに失敗しました。");
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      setFile(dt.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h5">ファイルアップロード</Typography>

        <Paper
          elevation={isDragging ? 8 : 2}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          sx={{
            p: 4,
            textAlign: "center",
            cursor: "pointer",
            border: (theme) => `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
            backgroundColor: isDragging ? (theme) => theme.palette.action.hover : "transparent",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Typography variant="body1" sx={{ mb: 1 }}>
            ドラッグ＆ドロップでファイルをここにドロップするか、クリックして選択してください。
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {file ? `選択中: ${file.name}` : "まだファイルが選択されていません。"}
          </Typography>
        </Paper>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={handleUpload} disabled={!file}>
            アップロード
          </Button>
          <Button variant="outlined" onClick={() => navigate("/files")}>ファイル一覧</Button>
        </Box>

        {progress > 0 && <LinearProgress variant="determinate" value={progress} />}
      </Box>
    </Container>
  );
};

export default Upload;