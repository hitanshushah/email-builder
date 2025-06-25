import React, { useEffect, useState } from 'react';
import { Drawer, Stack, Typography, CircularProgress, Button } from '@mui/material';
import { useSamplesDrawerOpen, resetDocument } from '../../documents/editor/EditorContext';
import SidebarButton from './SidebarButton';
import { useAuthStore } from '../../stores/authStore';
import getConfiguration from '../../getConfiguration';

export const SAMPLES_DRAWER_WIDTH = 240;

export default function SamplesDrawer({ refreshSignal }: { refreshSignal?: number }) {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const { isAuthenticated, user } = useAuthStore();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);

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

  const handleLoadTemplate = async (template: any) => {
    try {
      setSelectedId(template.id);
      const res = await fetch(`/api/fetch-template?link=${encodeURIComponent(template.link)}`);
      const json = await res.json();
      const doc = json.document ? json.document : json;
      resetDocument(doc);
    } catch {
      // Optionally show error
    }
  };

  const handleLoadEmpty = () => {
    setSelectedId(0);
    resetDocument({ root: { type: 'EmailLayout', data: {} } });
  };

  const handleLoadSample = (sample) => {
    setSelectedId('sample:' + sample.href);
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
              Empty
            </Button>
            {isAuthenticated && (
              <>
                {loading ? (
                  <CircularProgress size={24} />
                ) : error ? (
                  <Typography color="error">{error}</Typography>
                ) : templates.length === 0 ? (
                  <Typography color="text.secondary">No templates found.</Typography>
                ) : (
                  templates.map((template) => (
                    <Button
                      key={template.id}
                      onClick={() => handleLoadTemplate(template)}
                      style={{ textAlign: 'left', width: '100%' }}
                      variant={selectedId === template.id ? 'contained' : 'text'}
                      color={selectedId === template.id ? 'primary' : 'inherit'}
                    >
                      {template.name}
                    </Button>
                  ))
                )}
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
