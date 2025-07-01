import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  DialogContentText 
} from '@mui/material';
import { useAuthStore } from '../../stores/authStore';

interface CreateCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateCategoryDialog({ open, onClose, onSuccess }: CreateCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  React.useEffect(() => {
    if (open) {
      setCategoryName('');
      setError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!categoryName.trim()) {
      setError('Category name is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/create-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.username ? { 'x-authentik-username': user.username } : {}),
        },
        body: JSON.stringify({ categoryName: categoryName.trim() }),
      });

      const data = await res.json();

      if (res.status === 409 && data.categoryExists) {
        setError(data.error || 'Category name already exists. Please use a different name.');
        return;
      }

      if (data.success) {
        setCategoryName('');
        setError(null);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || 'Failed to create category.');
      }
    } catch (err) {
      console.error('Create category error:', err);
      setError('Failed to create category.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCategoryName('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>Create New Category</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Category Name"
          type="text"
          fullWidth
          variant="outlined"
          value={categoryName}
          onChange={e => { setCategoryName(e.target.value); setError(null); }}
          error={!!error}
          helperText={error || "Category names are compared ignoring case and spaces (e.g., 'My Category' and 'my category' are considered the same)"}
          disabled={isLoading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={isLoading}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleCreate} 
          disabled={isLoading || !categoryName.trim()}
        >
          {isLoading ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 