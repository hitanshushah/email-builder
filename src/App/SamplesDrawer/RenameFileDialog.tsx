import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, DialogContentText } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';

interface RenameDialogProps {
  open: boolean;
  onClose: () => void;
  currentName: string;
  label?: string;
  onRename: (newName: string) => Promise<void>;
}

const RenameDialog: React.FC<RenameDialogProps> = ({ open, onClose, currentName, label = 'Name', onRename }) => {
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setValue(currentName);
      setError(null);
    }
  }, [open, currentName]);

  const handleRename = async () => {
    if (!value.trim()) {
      setError(`${label} is required.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onRename(value.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Rename failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Rename {label}</DialogTitle>
      <DialogContent>
        <DialogContentText>Enter a new name for this {label.toLowerCase()}.</DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label={label}
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

export default RenameDialog; 