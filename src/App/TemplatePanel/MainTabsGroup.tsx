import React, { useMemo, useState } from 'react';

import {
  CodeOutlined,
  DataObjectOutlined,
  EditOutlined,
  PreviewOutlined,
} from '@mui/icons-material';
import { Button, Tab, Tabs, Tooltip, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, DialogContentText, Box, FormControlLabel, Radio, RadioGroup } from '@mui/material';

import {
  setSelectedMainTab,
  useSelectedMainTab,
  useDocument,
  useSelectedTemplate,
} from '../../documents/editor/EditorContext';
import { useAuthStore } from '../../stores/authStore';

function TemplateNameDialog({ open, onClose, onSave, isUpdate = false, currentDisplayName, currentFileName, selectedVersionId }: { 
  open: boolean; 
  onClose: () => void; 
  onSave: (name: string, templateKey?: string, useExistingName?: boolean, saveMode?: 'overwrite' | 'new') => void;
  isUpdate?: boolean;
  currentDisplayName?: string;
  currentFileName?: string;
  selectedVersionId?: number;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [nameChoice, setNameChoice] = useState<'new' | 'existing'>('new');
  const [saveMode, setSaveMode] = useState<'overwrite' | 'new'>('new');

  React.useEffect(() => {
    if (open) {
      setValue('');
      setError(null);
      setNameChoice('new');
      setSaveMode('new');
    }
  }, [open]);

  const handleSave = () => {
    if (saveMode === 'new' && nameChoice === 'new' && !value.trim()) {
      setError('File name is required.');
      return;
    }
    // If using existing name, pass currentFileName
    const nameToUse = nameChoice === 'existing' ? (currentFileName || '') : value.trim();
    onSave(nameToUse, undefined, nameChoice === 'existing', saveMode);
    setValue('');
    setError(null);
    setNameChoice('new');
    setSaveMode('new');
  };

  const handleCancel = () => {
    setValue('');
    setError(null);
    setNameChoice('new');
    setSaveMode('new');
    onClose();
  };

  const isPreviousVersion = selectedVersionId && selectedVersionId > 0;

  return (
    <>
      <Dialog open={open} onClose={handleCancel}>
        <DialogTitle>{isUpdate ? 'Update Template' : 'Save Template'}</DialogTitle>
        <DialogContent>
          {isUpdate && (
            <Box sx={{ fontWeight: 600, mb: 1, fontSize: 16 }}>
              {currentDisplayName}
            </Box>
          )}
          <DialogContentText>
            {isPreviousVersion 
              ? 'Choose how you want to save your changes to this version.'
              : isUpdate 
                ? 'Choose how you want to name this version of the template.'
                : 'Enter a file name for your template. This will be used to identify your template version.'
            }
          </DialogContentText>
          
          {isPreviousVersion && (
            <RadioGroup
              value={saveMode}
              onChange={(e) => setSaveMode(e.target.value as 'overwrite' | 'new')}
              sx={{ mb: 2 }}
            >
              <FormControlLabel 
                value="overwrite" 
                control={<Radio />} 
                label="Overwrite current version" 
              />
              <FormControlLabel 
                value="new" 
                control={<Radio />} 
                label="Create new version" 
              />
            </RadioGroup>
          )}
          
          {(!isUpdate || nameChoice === 'new') && saveMode === 'new' && (
            <RadioGroup
              value={nameChoice}
              onChange={(e) => setNameChoice(e.target.value as 'new' | 'existing')}
              sx={{ mb: 2 }}
            >
              <FormControlLabel 
                value="existing" 
                control={<Radio />} 
                label={`Use existing file name (${currentFileName || ''})`} 
              />
              <FormControlLabel 
                value="new" 
                control={<Radio />} 
                label="Enter new file name" 
              />
            </RadioGroup>
          )}
          
          {(!isUpdate || nameChoice === 'new') && saveMode === 'new' && (
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
              helperText={error || "File names are compared ignoring case and spaces (e.g., 'My File' and 'my file' are considered the same)"}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function MainTabsGroup({ setRefreshSignal }: { setRefreshSignal?: (n: number) => void }) {
  const document = useDocument();
  const selectedMainTab = useSelectedMainTab();
  const selectedTemplate = useSelectedTemplate();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  // Find the latest file name for the selected template
  const latestFileName = selectedTemplate?.file_name;

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

  const handleDialogSave = async (templateName: string, templateKey?: string, useExistingName?: boolean, saveMode?: 'overwrite' | 'new') => {
    setDialogOpen(false);
    try {
      // If we have a selected template, use its key for updates
      const keyToUse = templateKey || selectedTemplate?.key;
      
      // Don't send templateName when overwriting
      const requestBody: any = { 
        document, 
        templateKey: keyToUse,
        useExistingName,
        selectedVersionId: selectedTemplate?.version_id,
        saveMode
      };
      
      if (saveMode !== 'overwrite') {
        requestBody.templateName = templateName;
      }
      
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.username ? { 'x-authentik-username': user.username } : {}),
        },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      
      if (data.noChanges) {
        setSnackbar({ open: true, message: data.message || 'No changes detected.' });
        return;
      }
      
      if (res.status === 409 && data.templateExists) {
        // Template name exists, show error message
        setSnackbar({ open: true, message: data.error || 'Template name already exists. Please rename the new template.' });
        return;
      }
      
      if (data.success) {
        let message = '';
        if (data.isOverwrite) {
          message = 'Template version overwritten successfully!';
        } else if (data.isUpdate) {
          message = 'Template updated successfully!';
        } else {
          message = 'Template saved successfully!';
        }
        setSnackbar({ open: true, message });
        if (setRefreshSignal) setRefreshSignal(Date.now());
      } else {
        setSnackbar({ open: true, message: data.error || 'Save failed.' });
      }
    } catch (err) {
      console.error('Save error:', err);
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
              <Button size='small' variant="contained">Save</Button>
          }
        />
      </Tabs>
      <TemplateNameDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSave={handleDialogSave}
        isUpdate={!!selectedTemplate}
        currentDisplayName={selectedTemplate?.display_name}
        currentFileName={latestFileName}
        selectedVersionId={selectedTemplate?.version_id}
      />
      
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
