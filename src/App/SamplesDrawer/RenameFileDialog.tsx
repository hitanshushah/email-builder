import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, DialogContentText } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';

interface RenameFileDialogProps {
  open: boolean;
  onClose: () => void;
  versionId: number;
  currentFileName: string;
  onSuccess?: (newName: string) => void;
}

const RenameFileDialog: React.FC<RenameFileDialogProps> = ({ open, onClose, versionId, currentFileName, onSuccess }) => {
  const [value, setValue] = useState(currentFileName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  React.useEffect(() => {
    if (open) {
      setValue(currentFileName);
      setError(null);
    }
  }, [open, currentFileName]);

  const handleRename = async () => {
    if (!value.trim()) {
      setError('File name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rename-version', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.username ? { 'x-authentik-username': user.username } : {}),
        },
        body: JSON.stringify({ versionId, newFileName: value.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        if (onSuccess) onSuccess(value.trim());
        onClose();
      } else {
        setError(data.error || 'Rename failed.');
      }
    } catch (err) {
      setError('Rename failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Rename File</DialogTitle>
      <DialogContent>
        <DialogContentText>Enter a new name for this file version.</DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="File Name"
          type="text"
          fullWidth
          variant="outlined"
          value={value}
          onChange={e => { setValue(e.target.value); setError(null); }}
          error={!!error}
          helperText={error}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleRename} disabled={loading || !value.trim()}>
          {loading ? 'Renaming...' : 'Rename'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameFileDialog; 