import React, { useEffect, useState } from 'react';
import { Drawer, Stack, Typography, CircularProgress, Button, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSamplesDrawerOpen, setSelectedTemplate, resetDocument, useDocument, setDocument } from '../../documents/editor/EditorContext';
import SidebarButton from './SidebarButton';
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
      grouped[t.id].versions.push({
        ...t,
      });
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
  const document = useDocument();

  // Sample templates for unauthenticated users
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
      return;
    }
    setLoading(true);
    setError(null);
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
    } catch {
      // Optionally show error
    }
  };

  const handleTemplateEmpty = (template: GroupedTemplate) => {
    setSelectedId(`empty-${template.id}`);
    const latestVersion = template.versions && template.versions.length > 0 ? template.versions[0] : undefined;
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

  const handleLoadSample = (sample) => {
    setSelectedId('sample:' + sample.href);
    setSelectedTemplate(null);
    resetDocument(getConfiguration(sample.href));
  };

  const handleAccordionChange = (panel: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={samplesDrawerOpen}
      sx={{ width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0 }}
    >
      <Stack spacing={3} py={1} px={2} width={SAMPLES_DRAWER_WIDTH} justifyContent="space-between" height="100%">
        <Stack spacing={2} sx={{ '& .MuiButtonBase-root': { width: '100%', justifyContent: 'flex-start' } }}>
          <Typography variant="h6" component="h1" sx={{ p: 0.75 }}>
            Email Builder
          </Typography>
          {isAuthenticated && (
            <Typography variant="subtitle2" sx={{ p: 0.75, fontWeight: 600, color: '#0079CC' }}>
            Your Templates
          </Typography>
          )}
          <Stack alignItems="flex-start">
            <Button
              key={0}
              onClick={handleLoadEmpty}
              style={{ textAlign: 'left', width: '100%' }}
              variant={selectedId === 0 ? 'contained' : 'text'}
              color={selectedId === 0 ? 'primary' : 'inherit'}
            >
              Create New Template
            </Button>
            {isAuthenticated && (
              <>
                {loading ? (
                  <CircularProgress size={24} />
                ) : error ? (
                  <Typography color="error">{error}</Typography>
                ) : groupedTemplates.length === 0 ? (
                  <Typography color="text.secondary">No templates found.</Typography>
                ) : (
                  groupedTemplates.map((template: GroupedTemplate) => (
                    <Accordion
                      key={template.id}
                      expanded={expanded === template.id}
                      onChange={handleAccordionChange(template.id)}
                      sx={{ width: '100%' }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography fontWeight={600}>{template.display_name}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Button
                          key={`empty-${template.id}`}
                          onClick={() => handleTemplateEmpty(template)}
                          style={{ textAlign: 'left', width: '100%' }}
                          variant={selectedId === `empty-${template.id}` ? 'contained' : 'text'}
                          color={selectedId === `empty-${template.id}` ? 'primary' : 'inherit'}
                        >
                          Create New Version
                        </Button>
                        {template.versions.map((version) => (
                          <Button
                            key={version.version_id}
                            onClick={() => handleLoadTemplate(version)}
                            style={{ textAlign: 'left', width: '100%' }}
                            variant={selectedId === version.version_id ? 'contained' : 'text'}
                            color={selectedId === version.version_id ? 'primary' : 'inherit'}
                          >
                            {version.file_name}_v{version.version_no}
                          </Button>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))
                )}
                <Accordion
                  expanded={expanded === -1}
                  onChange={handleAccordionChange(-1)}
                  sx={{ width: '100%' }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Sample Templates</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {sampleTemplates.map((sample) => (
                      <Button
                        key={sample.href}
                        onClick={() => handleLoadSample(sample)}
                        style={{ textAlign: 'left', width: '100%' }}
                        variant={selectedId === 'sample:' + sample.href ? 'contained' : 'text'}
                        color={selectedId === 'sample:' + sample.href ? 'primary' : 'inherit'}
                      >
                        {sample.name}
                      </Button>
                    ))}
                  </AccordionDetails>
                </Accordion>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Typography variant="subtitle2" sx={{ p: 0.75, fontWeight: 600, color: '#0079CC' }}>
                  Sample Templates
                </Typography>
                {sampleTemplates.map((sample, idx) => (
                  <SidebarButton
                    key={sample.href}
                    href={sample.href}
                    selected={selectedId === 'sample:' + sample.href}
                    onClick={() => handleLoadSample(sample)}
                  >
                    {sample.name}
                  </SidebarButton>
                ))}
              </>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Drawer>
  );
}
