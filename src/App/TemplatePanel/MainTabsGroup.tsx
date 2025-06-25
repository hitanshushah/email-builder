import React, { useMemo, useState } from 'react';

import {
  CodeOutlined,
  DataObjectOutlined,
  EditOutlined,
  PreviewOutlined,
} from '@mui/icons-material';
import { Button, Tab, Tabs, Tooltip, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

import {
  setSelectedMainTab,
  useSelectedMainTab,
  useDocument,
} from '../../documents/editor/EditorContext';
import { useAuthStore } from '../../stores/authStore';

function TemplateNameDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (name: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!value.trim()) {
      setError('Template name is required.');
      return;
    }
    onSave(value.trim());
    setValue('');
    setError(null);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Save Template</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Template Name"
          fullWidth
          value={value}
          onChange={e => { setValue(e.target.value); setError(null); }}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function MainTabsGroup({ setRefreshSignal }: { setRefreshSignal?: (n: number) => void }) {
  const document = useDocument();
  const selectedMainTab = useSelectedMainTab();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  const jsonMemo = useMemo(() => {
    return JSON.stringify(document, null, 2);
  }, [document]);

  const handleChange = async (_: unknown, v: unknown) => {
    switch (v) {
      case 'json':
      case 'preview':
      case 'editor':
      case 'html':
        setSelectedMainTab(v);
        return;
      case 'save': {
        if (!isAuthenticated) {
          setSnackbar({ open: true, message: 'Please login to save document' });
          return;
        }
        setDialogOpen(true);
        return;
      }
      default:
        setSelectedMainTab('editor');
    }
  };

  const handleDialogSave = async (templateName: string) => {
    setDialogOpen(false);
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.username ? { 'x-authentik-username': user.username } : {}),
        },
        body: JSON.stringify({ document, templateName }),
      });
      const data = await res.json();
      if (data.success) {
        setSnackbar({ open: true, message: 'Template saved successfully!' });
        if (setRefreshSignal) setRefreshSignal(Date.now());
      } else {
        setSnackbar({ open: true, message: data.error || 'Save failed.' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Save failed.' });
    }
  };

  return (
    <>
      <Tabs value={selectedMainTab} onChange={handleChange}>
        <Tab
          value="editor"
          label={
            <Tooltip title="Edit">
              <EditOutlined fontSize="small" />
            </Tooltip>
          }
        />
        <Tab
          value="preview"
          label={
            <Tooltip title="Preview">
              <PreviewOutlined fontSize="small" />
            </Tooltip>
          }
        />
        <Tab
          value="html"
          label={
            <Tooltip title="HTML output">
              <CodeOutlined fontSize="small" />
            </Tooltip>
          }
        />
        <Tab
          value="json"
          label={
            <Tooltip title="JSON output">
              <DataObjectOutlined fontSize="small" />
            </Tooltip>
          }
        />
        <Tab
          value="save"
          label={
              <Button size='small' variant="outlined">Save</Button>
          }
        />
      </Tabs>
      <TemplateNameDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleDialogSave} />
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </>
  );
}
