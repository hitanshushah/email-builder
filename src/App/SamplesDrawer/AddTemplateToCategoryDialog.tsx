import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Typography
} from '@mui/material';
import { useAuthStore } from '../../stores/authStore';

interface AddTemplateToCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  categoryId: number;
  categoryName: string;
  onSuccess?: () => void;
}

export default function AddTemplateToCategoryDialog({ 
  open, 
  onClose, 
  categoryId, 
  categoryName,
  onSuccess
}: AddTemplateToCategoryDialogProps) {
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [addingTemplate, setAddingTemplate] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (open && categoryId) {
      fetchAvailableTemplates();
    }
  }, [open, categoryId]);

  const fetchAvailableTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/categories/${categoryId}/available-templates`, {
        headers: user?.username ? { 'x-authentik-username': user.username } : {},
      });
      
      const data = await res.json();
      
      if (data.success) {
        setAvailableTemplates(data.templates);
      } else {
        setError(data.error || 'Failed to fetch available templates');
      }
    } catch (err) {
      console.error('Fetch available templates error:', err);
      setError('Failed to fetch available templates');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = async () => {
    if (!selectedTemplateId) return;
    
    setAddingTemplate(true);
    
    try {
      const res = await fetch(`/api/categories/${categoryId}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.username ? { 'x-authentik-username': user.username } : {}),
        },
        body: JSON.stringify({ templateId: selectedTemplateId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSelectedTemplateId(null);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || 'Failed to add template to category');
      }
    } catch (err) {
      console.error('Add template to category error:', err);
      setError('Failed to add template to category');
    } finally {
      setAddingTemplate(false);
    }
  };

  const handleClose = () => {
    setSelectedTemplateId(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Template to "{categoryName}"</DialogTitle>
      <DialogContent>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress />
          </div>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : availableTemplates.length === 0 ? (
          <Typography color="text.secondary">
            No available templates to add to this category.
          </Typography>
        ) : (
          <List>
            {availableTemplates.map((template) => (
              <ListItem key={template.id} disablePadding>
                <ListItemButton
                  selected={selectedTemplateId === template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <ListItemText primary={template.display_name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={addingTemplate}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleAddTemplate} 
          disabled={!selectedTemplateId || addingTemplate}
        >
          {addingTemplate ? 'Adding...' : 'Add Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 