import React, { useEffect, useState } from 'react';
import {
  Drawer, Stack, Typography, CircularProgress,
  List, ListItemButton, ListItemText, Collapse,
  ListSubheader, Divider, IconButton,
  Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import { ExpandLess, ExpandMore, AddOutlined } from '@mui/icons-material';
import AddTemplateToCategoryDialog from './AddTemplateToCategoryDialog';
import {
  useSamplesDrawerOpen,
  setSelectedTemplate,
  resetDocument,
  useDocument,
  setDocument
} from '../../documents/editor/EditorContext';
import { useAuthStore } from '../../stores/authStore';
import getConfiguration from '../../getConfiguration';
import CreateCategoryDialog from '../TemplatePanel/CreateCategoryDialog';
import ContextMenuButton from './ContextMenuButton';
import RenameFileDialog from './RenameFileDialog';
import RenameDialog from './RenameFileDialog';

export const SAMPLES_DRAWER_WIDTH = 300;

type GroupedTemplate = {
  id: number;
  key: string;
  display_name: string;
  versions: any[];
};

function groupTemplatesByDisplayName(templates: any[]): GroupedTemplate[] {
  const grouped: Record<number, GroupedTemplate> = {};
  for (const t of templates) {
    if (!t.id) continue;
    if (!grouped[t.id]) {
      grouped[t.id] = {
        display_name: t.display_name,
        key: t.key,
        id: t.id,
        versions: [],
      };
    }
    if (t.version_id) {
      grouped[t.id].versions.push({ ...t });
    }
  }
  return Object.values(grouped);
}

export default function SamplesDrawer({
  refreshSignal,
  setRefreshSignal,
}: {
  refreshSignal?: number;
  setRefreshSignal?: (n: number) => void;
}) {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const { isAuthenticated, user } = useAuthStore();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | string | null>(0);
  const [expanded, setExpanded] = useState<number | false>(false);
  const [samplesExpanded, setSamplesExpanded] = useState(!isAuthenticated);
  const document = useDocument();
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoryTemplates, setCategoryTemplates] = useState<Record<number, any[]>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
  const [addTemplateDialog, setAddTemplateDialog] = useState<{ open: boolean; categoryId: number; categoryName: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; versionId: number; currentFileName: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; version: any; templateName: string } | null>(null);
  const [renameTemplateDialog, setRenameTemplateDialog] = useState<{ open: boolean; templateId: number; currentName: string } | null>(null);
  const [deleteTemplateDialog, setDeleteTemplateDialog] = useState<{ open: boolean; templateId: number; templateName: string } | null>(null);
  const [unlinkDialog, setUnlinkDialog] = useState<{ open: boolean; templateId: number; categoryId: number; templateName: string; categoryName: string } | null>(null);
  const [renameCategoryDialog, setRenameCategoryDialog] = useState<{ open: boolean; categoryId: number; currentName: string } | null>(null);
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<{ open: boolean; categoryId: number; categoryName: string } | null>(null);

  const sampleTemplates = [
    { name: 'Welcome Email', href: '#sample/welcome' },
    { name: 'One-time passcode (OTP)', href: '#sample/one-time-password' },
    { name: 'Reset password', href: '#sample/reset-password' },
    { name: 'E-commerce receipt', href: '#sample/order-ecomerce' },
    { name: 'Subscription receipt', href: '#sample/subscription-receipt' },
    { name: 'Reservation reminder', href: '#sample/reservation-reminder' },
    { name: 'Post metrics', href: '#sample/post-metrics-report' },
    { name: 'Respond to inquiry', href: '#sample/respond-to-message' },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      setTemplates([]);
      setSamplesExpanded(true);
      return;
    }
    setLoading(true);
    setError(null);
    setSamplesExpanded(false);
    fetch('/api/user-templates', {
      headers: user?.username ? { 'x-authentik-username': user.username } : {},
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTemplates(data.templates);
        } else {
          setError(data.error || 'Failed to fetch templates');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch templates');
        setLoading(false);
      });
  }, [isAuthenticated, refreshSignal, user?.username]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCategories([]);
      return;
    }
    setCategoriesLoading(true);
    setCategoriesError(null);
    fetch('/api/categories', {
      headers: user?.username ? { 'x-authentik-username': user.username } : {},
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.categories);
        } else {
          setCategoriesError(data.error || 'Failed to fetch categories');
        }
        setCategoriesLoading(false);
      })
      .catch(() => {
        setCategoriesError('Failed to fetch categories');
        setCategoriesLoading(false);
      });
  }, [isAuthenticated, refreshSignal, user?.username]);

  useEffect(() => {
    if (refreshSignal && Object.keys(categoryTemplates).length > 0) {
      refreshAllCategoryTemplates();
    }
  }, [refreshSignal]);

  useEffect(() => {
    if (refreshSignal) {
      setCategoryTemplates({});
      setExpandedCategories({});
    }
  }, [refreshSignal]);

  const groupedTemplates: GroupedTemplate[] = groupTemplatesByDisplayName(templates);

  const fetchCategoryTemplates = async (categoryId: number) => {
    try {
      const res = await fetch(`/api/categories/${categoryId}/templates`);
      const data = await res.json();
      if (data.success) {
        setCategoryTemplates(prev => ({
          ...prev,
          [categoryId]: data.templates
        }));
      }
    } catch (err) {
      console.error('Error fetching category templates:', err);
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    const isExpanded = expandedCategories[categoryId];
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !isExpanded
    }));
    
    if (!isExpanded && !categoryTemplates[categoryId]) {
      fetchCategoryTemplates(categoryId);
    }
  };

  const handleAddTemplateToCategory = (categoryId: number, categoryName: string) => {
    setAddTemplateDialog({ open: true, categoryId, categoryName });
  };

  const handleAddTemplateSuccess = () => {
    if (addTemplateDialog) {
      fetchCategoryTemplates(addTemplateDialog.categoryId);
    }
    if (setRefreshSignal) setRefreshSignal(Date.now());
  };

  const refreshAllCategoryTemplates = () => {
    Object.keys(categoryTemplates).forEach(categoryId => {
      fetchCategoryTemplates(parseInt(categoryId));
    });
  };

  const handleLoadTemplate = async (template: any) => {
    try {
      setSelectedId(template.version_id);
      const res = await fetch(`/api/fetch-template?link=${encodeURIComponent(template.link)}`);
      const json = await res.json();
      const doc = json.document ? json.document : json;
      resetDocument(doc);
      setSelectedTemplate({
        id: template.id,
        key: template.key,
        display_name: template.display_name,
        file_name: template.file_name,
        version_no: template.version_no,
        version_id: template.version_id
      });
    } catch {}
  };

  const handleTemplateEmpty = (template: GroupedTemplate) => {
    setSelectedId(`empty-${template.id}`);
    const latestVersion = template.versions?.[0];
    setSelectedTemplate({
      id: template.id,
      key: template.key,
      display_name: template.display_name,
      file_name: latestVersion?.file_name,
      version_no: 0
    });
    setDocument({ root: { type: 'EmailLayout', data: {} } });
  };

  const handleLoadEmpty = () => {
    setSelectedId(0);
    setSelectedTemplate(null);
    resetDocument({ root: { type: 'EmailLayout', data: {} } });
  };

  const handleLoadSample = (sample: any) => {
    setSelectedId('sample:' + sample.href);
    setSelectedTemplate(null);
    resetDocument(getConfiguration(sample.href));
  };

  const handleCopyVersion = async (version: any) => {
    try {
      const res = await fetch(`/api/fetch-template?link=${encodeURIComponent(version.link)}`);
      const data = await res.json();
      const jsonStr = JSON.stringify(data.document ? data.document : data, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      setSnackbar({ open: true, message: 'Copied JSON to clipboard!' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to copy JSON.' });
    }
  };

  const handleDeleteVersion = async (version: any) => {
    try {
      const res = await fetch('/api/delete-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: version.version_id }),
      });
      const data = await res.json();
      if (data.success) {
        setSnackbar({ open: true, message: 'File deleted!' });
        if (setRefreshSignal) setRefreshSignal(Date.now());
      } else {
        setSnackbar({ open: true, message: data.error || 'Delete failed.' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Delete failed.' });
    }
  };

  return (
    <><Drawer
      variant="persistent"
      anchor="left"
      open={samplesDrawerOpen}
      sx={{ width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0 }}
    >
      <Stack spacing={3} py={1} px={2} width={SAMPLES_DRAWER_WIDTH} justifyContent="space-between" height="100%">
        <Stack spacing={2}>
          <Typography variant="h6" component="h1" sx={{ p: 0.75,  color: '#0b2d53' }}>
            Email Builder
          </Typography>

          <List
            sx={{ width: '100%', bgcolor: 'background.paper' }}
            component="nav"
            aria-labelledby="template-list"
          >
            <ListItemButton
              selected={selectedId === 0}
              onClick={handleLoadEmpty}
              sx={{
                width: 'fit-content !important',
                border: '1px solid',
                borderColor: 'black',
                color: 'text.primary',
                bgcolor: 'transparent',
                paddingY: 0.5,
                borderRadius: 2
              }}
            >
              <ListItemText primary="Create New Template" />
            </ListItemButton>
            {isAuthenticated && (
              <>
                <ListSubheader component="div"
                  sx={{
                    fontWeight: 'bold',
                    color: '#1565C0'
                  }}
                >
                  Categories
                  {categories.length > 0 && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (!isAuthenticated) {
                          setSnackbar({ open: true, message: 'Please login to create category' });
                          return;
                        }
                        setCategoryDialogOpen(true);
                      }}
                      sx={{ color: '#1565C0' }}
                    >
                      <AddOutlined fontSize="small" />
                    </IconButton>
                  )}
                </ListSubheader>
                {categoriesLoading ? (
                  <CircularProgress size={20} />
                ) : categoriesError ? (
                  <Typography color="error" sx={{ px: 1 }}>{categoriesError}</Typography>
                ) : categories.length === 0 ? (
                  <ListItemButton
                    sx={{
                      width: 'fit-content !important',
                      border: '1px solid',
                      borderColor: 'divider',
                      color: 'text.secondary',
                      bgcolor: 'transparent',
                      paddingY: 0.5,
                      borderRadius: 2,
                    }}
                    onClick={() => {
                      if (!isAuthenticated) {
                        setSnackbar({ open: true, message: 'Please login to create category' });
                        return;
                      }
                      setCategoryDialogOpen(true);
                    } }
                  >
                    <ListItemText primary="Create New Category" />
                  </ListItemButton>
                ) : (
                  categories.map((cat) => {
                    const isExpanded = expandedCategories[cat.id];
                    const templates = categoryTemplates[cat.id] || [];
                    const groupedCategoryTemplates = groupTemplatesByDisplayName(templates);

                    return (
                      <React.Fragment key={cat.id}>
                        <ListItemButton
                          onClick={() => handleCategoryToggle(cat.id)}
                          sx={{ display: 'flex', justifyContent: 'space-between' }}
                        >
                          <ListItemText primary={cat.display_name}  primaryTypographyProps={{
                            fontWeight: 600,
                            color: '#0b2d53'
                          }}/>
                          <ContextMenuButton
                            level="category"
                            onRename={() => setRenameCategoryDialog({ open: true, categoryId: cat.id, currentName: cat.display_name })}
                            onDelete={() => setDeleteCategoryDialog({ open: true, categoryId: cat.id, categoryName: cat.display_name })}
                          />
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddTemplateToCategory(cat.id, cat.display_name);
                              } }
                              sx={{ mr: 1 }}
                            >
                              <AddOutlined fontSize="small" />
                            </IconButton>
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </div>
                        </ListItemButton>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding>
                            {groupedCategoryTemplates.length === 0 ? (
                              <ListItemButton sx={{ pl: 4 }} disabled>
                                <ListItemText primary="No templates in this category" />
                              </ListItemButton>
                            ) : (
                              groupedCategoryTemplates.map((template) => {
                                const isTemplateOpen = expanded === template.id;
                                return (
                                  <React.Fragment key={template.id}>
                                    <ListItemButton
                                      sx={{ pl: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                      onClick={() => setExpanded(isTemplateOpen ? false : template.id)}
                                    >
                                      <ListItemText primary={`${template.display_name} Template`} primaryTypographyProps={{
                                        fontWeight: 500,
                                      }} />
                                      <ContextMenuButton
                                        level="template-in-category"
                                        onRename={() => setRenameTemplateDialog({ open: true, templateId: template.id, currentName: template.display_name })}
                                        onDelete={() => setDeleteTemplateDialog({ open: true, templateId: template.id, templateName: template.display_name })}
                                        onRemoveFromCategory={() => setUnlinkDialog({ open: true, templateId: template.id, categoryId: cat.id, templateName: template.display_name, categoryName: cat.display_name })}
                                      />
                                      {isTemplateOpen ? <ExpandLess /> : <ExpandMore />}
                                    </ListItemButton>
                                    <Collapse in={isTemplateOpen} timeout="auto" unmountOnExit>
                                      <List component="div" disablePadding>
                                        <ListItemButton
                                          sx={{
                                            width: 'fit-content !important',
                                            border: '1px solid',
                                            borderColor: 'black',
                                            color: 'text.primary',
                                            bgcolor: 'transparent',
                                            paddingY: 0,
                                            paddingX: 0.5,
                                            borderRadius: 2,
                                            ml: 6
                                          }}
                                          selected={selectedId === `empty-${template.id}`}
                                          onClick={() => handleTemplateEmpty(template)}
                                        >
                                          <ListItemText primary="Create New Version" primaryTypographyProps={{ fontSize: '11px', fontWeight: 500}}/>
                                        </ListItemButton>
                                        {template.versions.map((version: any) => (
                                          <ListItemButton
                                            key={version.version_id}
                                            sx={{ pl: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                            selected={selectedId === version.version_id}
                                            onClick={() => handleLoadTemplate(version)}
                                          >
                                            <ListItemText primary={`${version.file_name}_v${version.version_no}`} />
                                            <ContextMenuButton
                                              level="file"
                                              onRename={() => setRenameDialog({ open: true, versionId: version.version_id, currentFileName: version.file_name })}
                                              onDelete={() => setDeleteDialog({ open: true, version, templateName: template.display_name })}
                                              onCopy={() => handleCopyVersion(version)}
                                            />
                                          </ListItemButton>
                                        ))}
                                      </List>
                                    </Collapse>
                                  </React.Fragment>
                                );
                              })
                            )}
                          </List>
                        </Collapse>
                      </React.Fragment>
                    );
                  })
                )}
                <Divider sx={{ my: 1 }} />
              </>
            )}

            {loading ? (
              <CircularProgress size={24} />
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : groupedTemplates.length === 0 ? (
              <Typography color="text.secondary" sx={{ px: 1 }}>No templates found.</Typography>
            ) : (
              <>
                <ListSubheader component="div"
                  sx={{
                    fontWeight: 'bold',
                    color: '#1565C0'
                  }}
                >
                  Templates
                </ListSubheader>
                {groupedTemplates.map((template) => {
                  const isOpen = expanded === template.id;
                  return (
                    <React.Fragment key={template.id}>
                      <ListItemButton onClick={() => setExpanded(isOpen ? false : template.id)}>
                        <ListItemText primary={template.display_name}  primaryTypographyProps={{
                                        fontWeight: 500,
                                      }} />
                        <ContextMenuButton
                          level="template"
                          onRename={() => setRenameTemplateDialog({ open: true, templateId: template.id, currentName: template.display_name })}
                          onDelete={() => setDeleteTemplateDialog({ open: true, templateId: template.id, templateName: template.display_name })}
                        />
                        {isOpen ? <ExpandLess /> : <ExpandMore />}
                      </ListItemButton>
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          <ListItemButton
                            sx={{
                              width: 'fit-content !important',
                              border: '1px solid',
                              borderColor: 'black',
                              color: 'text.primary',
                              bgcolor: 'transparent',
                              paddingY: 0,
                              paddingX: 0.5,
                              borderRadius: 2,
                              ml: 4
                            }}
                            selected={selectedId === `empty-${template.id}`}
                            onClick={() => handleTemplateEmpty(template)}
                          >
                            <ListItemText primary="Create New Version" primaryTypographyProps={{ fontSize: '11px', fontWeight: 500}}/>
                          </ListItemButton>
                          {template.versions.map((version) => (
                            <ListItemButton
                              key={version.version_id}
                              sx={{ pl: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                              selected={selectedId === version.version_id}
                              onClick={() => handleLoadTemplate(version)}
                            >
                              <ListItemText primary={`${version.file_name}_v${version.version_no}`} />
                              <ContextMenuButton
                                level="file"
                                onRename={() => setRenameDialog({ open: true, versionId: version.version_id, currentFileName: version.file_name })}
                                onDelete={() => setDeleteDialog({ open: true, version, templateName: template.display_name })}
                                onCopy={() => handleCopyVersion(version)}
                              />
                            </ListItemButton>
                          ))}
                        </List>
                      </Collapse>
                      <Divider />
                    </React.Fragment>
                  );
                })}
              </>
            )}

            <ListItemButton onClick={() => setSamplesExpanded(!samplesExpanded)}>
              <ListItemText primary="Sample Templates"  primaryTypographyProps={{ fontWeight: 500 }} />
              {samplesExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={samplesExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {sampleTemplates.map((sample) => (
                  <ListItemButton
                    key={sample.href}
                    sx={{ pl: 4 }}
                    selected={selectedId === 'sample:' + sample.href}
                    onClick={() => handleLoadSample(sample)}
                  >
                    <ListItemText primary={sample.name} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </List>
        </Stack>
      </Stack>

      {addTemplateDialog && (
        <AddTemplateToCategoryDialog
          open={addTemplateDialog.open}
          onClose={() => setAddTemplateDialog(null)}
          categoryId={addTemplateDialog.categoryId}
          categoryName={addTemplateDialog.categoryName}
          onSuccess={handleAddTemplateSuccess} />
      )}
    </Drawer><CreateCategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        onSuccess={() => {
          setSnackbar({ open: true, message: 'Category created successfully!' });
          if (setRefreshSignal) setRefreshSignal(Date.now());
        } } /><Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message} />
      {renameDialog && (
        <RenameDialog
          open={renameDialog.open}
          onClose={() => setRenameDialog(null)}
          currentName={renameDialog.currentFileName}
          label="File"
          onRename={async (newName) => {
            const res = await fetch('/api/rename-version', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ versionId: renameDialog.versionId, newFileName: newName }),
            });
            const data = await res.json();
            if (data.success) {
              setRenameDialog(null);
              if (setRefreshSignal) setRefreshSignal(Date.now());
            } else {
              throw new Error(data.error || 'Rename failed.');
            }
          }}
        />
      )}
      {deleteDialog && (
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog(null)}>
          <DialogTitle>Delete File</DialogTitle>
          <DialogContent>
            Are you sure you want to delete <b>{deleteDialog.version.file_name}</b> from <b>{deleteDialog.templateName}</b>?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={async () => {
              await handleDeleteVersion(deleteDialog.version);
              setDeleteDialog(null);
            }}>Delete</Button>
          </DialogActions>
        </Dialog>
      )}
      {renameTemplateDialog && (
        <RenameDialog
          open={renameTemplateDialog.open}
          onClose={() => setRenameTemplateDialog(null)}
          currentName={renameTemplateDialog.currentName}
          label="Template"
          onRename={async (newName) => {
            const res = await fetch('/api/rename-template', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ templateId: renameTemplateDialog.templateId, newDisplayName: newName }),
            });
            const data = await res.json();
            if (data.success) {
              setSnackbar({ open: true, message: 'Template renamed!' });
              if (setRefreshSignal) setRefreshSignal(Date.now());
            } else if (data.error && data.error.toLowerCase().includes('taken')) {
              throw new Error('Template name already taken.');
            } else {
              throw new Error(data.error || 'Rename failed.');
            }
          }}
        />
      )}
      {deleteTemplateDialog && (
        <Dialog open={deleteTemplateDialog.open} onClose={() => setDeleteTemplateDialog(null)}>
          <DialogTitle>Delete Template</DialogTitle>
          <DialogContent>
            Are you sure you want to delete <b>{deleteTemplateDialog.templateName}</b>?<br />
            <b>Warning:</b> This will delete all its file versions.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTemplateDialog(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={async () => {
              const res = await fetch('/api/delete-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId: deleteTemplateDialog.templateId }),
              });
              const data = await res.json();
              if (data.success) {
                setSnackbar({ open: true, message: 'Template deleted!' });
                if (setRefreshSignal) setRefreshSignal(Date.now());
              } else {
                setSnackbar({ open: true, message: data.error || 'Delete failed.' });
              }
              setDeleteTemplateDialog(null);
            }}>Delete</Button>
          </DialogActions>
        </Dialog>
      )}
      {unlinkDialog && (
        <Dialog open={unlinkDialog.open} onClose={() => setUnlinkDialog(null)}>
          <DialogTitle>Unlink Template</DialogTitle>
          <DialogContent>
            Are you sure you want to unlink <b>{unlinkDialog.templateName}</b> from <b>{unlinkDialog.categoryName}</b>?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUnlinkDialog(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={async () => {
              const res = await fetch('/api/unlink-template-category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId: unlinkDialog.templateId, categoryId: unlinkDialog.categoryId }),
              });
              const data = await res.json();
              if (data.success) {
                setSnackbar({ open: true, message: 'Template unlinked from category!' });
                if (setRefreshSignal) setRefreshSignal(Date.now());
              } else {
                setSnackbar({ open: true, message: data.error || 'Unlink failed.' });
              }
              setUnlinkDialog(null);
            }}>Unlink</Button>
          </DialogActions>
        </Dialog>
      )}
      {renameCategoryDialog && (
        <RenameDialog
          open={renameCategoryDialog.open}
          onClose={() => setRenameCategoryDialog(null)}
          currentName={renameCategoryDialog.currentName}
          label="Category"
          onRename={async (newName) => {
            const res = await fetch('/api/rename-category', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ categoryId: renameCategoryDialog.categoryId, newDisplayName: newName }),
            });
            const data = await res.json();
            if (data.success) {
              setSnackbar({ open: true, message: 'Category renamed!' });
              if (setRefreshSignal) setRefreshSignal(Date.now());
            } else if (data.error && data.error.toLowerCase().includes('exists')) {
              throw new Error('Category name already exists.');
            } else {
              throw new Error(data.error || 'Rename failed.');
            }
          }}
        />
      )}
      {deleteCategoryDialog && (
        <Dialog open={deleteCategoryDialog.open} onClose={() => setDeleteCategoryDialog(null)}>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogContent>
            Are you sure you want to delete <b>{deleteCategoryDialog.categoryName}</b>?<br />
            <b>Warning:</b> This will only remove the category and its links. Templates will not be deleted, just moved to the Templates section.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteCategoryDialog(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={async () => {
              const res = await fetch('/api/delete-category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryId: deleteCategoryDialog.categoryId }),
              });
              const data = await res.json();
              if (data.success) {
                setSnackbar({ open: true, message: 'Category deleted!' });
                if (setRefreshSignal) setRefreshSignal(Date.now());
              } else {
                setSnackbar({ open: true, message: data.error || 'Delete failed.' });
              }
              setDeleteCategoryDialog(null);
            }}>Delete</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
