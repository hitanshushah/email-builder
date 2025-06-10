import React, { useMemo } from 'react';

import {
  CodeOutlined,
  DataObjectOutlined,
  EditOutlined,
  PreviewOutlined,
} from '@mui/icons-material';
import { Button, Tab, Tabs, Tooltip } from '@mui/material';

import {
  setSelectedMainTab,
  useSelectedMainTab,
  useDocument,
} from '../../documents/editor/EditorContext';

export default function MainTabsGroup() {
  const document = useDocument();
  const selectedMainTab = useSelectedMainTab();

  const jsonMemo = useMemo(() => {
    return JSON.stringify(document, null, 2);
  }, [document]);

  const handleChange = (_: unknown, v: unknown) => {
    switch (v) {
      case 'json':
      case 'preview':
      case 'editor':
      case 'html':
        setSelectedMainTab(v);
        return;
      case 'save':
        fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ json: jsonMemo }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log('Saved to MinIO:', data);
          })
          .catch((err) => {
            console.error('Save failed:', err);
          });
        return;
      default:
        setSelectedMainTab('editor');
    }
  };

  return (
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
      <Tab
        value="save"
        label={
            <Button size='small' variant="contained">Publish</Button>
        }
      />
    </Tabs>
  );
}
