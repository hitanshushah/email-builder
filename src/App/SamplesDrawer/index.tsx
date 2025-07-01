import React, { useEffect, useState } from 'react';
import {
  Drawer, Stack, Typography, CircularProgress,
  List, ListItemButton, ListItemText, Collapse,
  ListSubheader, Divider
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import {
  useSamplesDrawerOpen,
  setSelectedTemplate,
  resetDocument,
  useDocument,
  setDocument
} from '../../documents/editor/EditorContext';
import { useAuthStore } from '../../stores/authStore';
import getConfiguration from '../../getConfiguration';

export const SAMPLES_DRAWER_WIDTH = 240;

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

export default function SamplesDrawer({ refreshSignal }: { refreshSignal?: number }) {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const { isAuthenticated, user } = useAuthStore();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [expanded, setExpanded] = useState<number | false>(false);
  const [samplesExpanded, setSamplesExpanded] = useState(!isAuthenticated); // open by default if not authenticated
  const document = useDocument();

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

  const groupedTemplates: GroupedTemplate[] = groupTemplatesByDisplayName(templates);

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

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={samplesDrawerOpen}
      sx={{ width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0 }}
    >
      <Stack spacing={3} py={1} px={2} width={SAMPLES_DRAWER_WIDTH} justifyContent="space-between" height="100%">
        <Stack spacing={2}>
          <Typography variant="h6" component="h1" sx={{ p: 0.75 }}>
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
            >
              <ListItemText primary="Create New Template" />
            </ListItemButton>

            {isAuthenticated && (
              <>
                {loading ? (
                  <CircularProgress size={24} />
                ) : error ? (
                  <Typography color="error">{error}</Typography>
                ) : groupedTemplates.length === 0 ? (
                  <Typography color="text.secondary" sx={{ px: 1 }}>No templates found.</Typography>
                ) : (
                  <>
                    <ListSubheader component="div">Your Templates</ListSubheader>
                    {groupedTemplates.map((template) => {
                      const isOpen = expanded === template.id;
                      return (
                        <React.Fragment key={template.id}>
                          <ListItemButton onClick={() => setExpanded(isOpen ? false : template.id)}>
                            <ListItemText primary={template.display_name} />
                            {isOpen ? <ExpandLess /> : <ExpandMore />}
                          </ListItemButton>
                          <Collapse in={isOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                              <ListItemButton
                                sx={{ pl: 4 }}
                                selected={selectedId === `empty-${template.id}`}
                                onClick={() => handleTemplateEmpty(template)}
                              >
                                <ListItemText primary="Create New Version" />
                              </ListItemButton>
                              {template.versions.map((version) => (
                                <ListItemButton
                                  key={version.version_id}
                                  sx={{ pl: 4 }}
                                  selected={selectedId === version.version_id}
                                  onClick={() => handleLoadTemplate(version)}
                                >
                                  <ListItemText primary={`${version.file_name}_v${version.version_no}`} />
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
              </>
            )}

            <ListItemButton onClick={() => setSamplesExpanded(!samplesExpanded)}>
              <ListItemText primary="Sample Templates" />
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
    </Drawer>
  );
}
