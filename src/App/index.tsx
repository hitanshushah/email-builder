import React, { useEffect, useState } from 'react';

import { Stack, useTheme, Box, Chip, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useInspectorDrawerOpen, useSamplesDrawerOpen } from '../documents/editor/EditorContext';
import { useAuthStore } from '../stores/authStore';

import InspectorDrawer, { INSPECTOR_DRAWER_WIDTH } from './InspectorDrawer';
import SamplesDrawer, { SAMPLES_DRAWER_WIDTH } from './SamplesDrawer';
import TemplatePanel from './TemplatePanel';
import Joyride from 'react-joyride';

function useDrawerTransition(cssProperty: 'margin-left' | 'margin-right', open: boolean) {
  const { transitions } = useTheme();
  return transitions.create(cssProperty, {
    easing: !open ? transitions.easing.sharp : transitions.easing.easeOut,
    duration: !open ? transitions.duration.leavingScreen : transitions.duration.enteringScreen,
  });
}

export default function App() {
  const inspectorDrawerOpen = useInspectorDrawerOpen();
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const { user, isAuthenticated } = useAuthStore();

  const marginLeftTransition = useDrawerTransition('margin-left', samplesDrawerOpen);
  const marginRightTransition = useDrawerTransition('margin-right', inspectorDrawerOpen);

  const [refreshSignal, setRefreshSignal] = useState(0);
  const [demoBannerOpen, setDemoBannerOpen] = useState(true);
  const [tourRun, setTourRun] = useState(true); // Start tour on every load

  const handleStartTour = () => {
    setTourRun(false); // Force Joyride to reset
    setTimeout(() => setTourRun(true), 0); // Restart Joyride
  };

  const isDemoUser = isAuthenticated && user && user.username === 'demo-user';

  return (
    <>
      <Joyride
        steps={[
          {
            target: '[data-tour="create-template"]',
            content: 'Start by creating a new template here.',
            disableBeacon: true,
          },
          {
            target: '[data-tour="create-version"]',
            content: 'Create a new version of your template.',
          },
          {
            target: '[data-tour="update-version"]',
            content: 'Update the current version of your template.',
          },
          {
            target: '[data-tour="create-category"]',
            content: 'Create a new category to organize your templates.',
          },
          {
            target: '[data-tour="link-template-category"]',
            content: 'Link a template to a category using this button.',
          },
          {
            target: '[data-tour="save-template"]',
            content: 'Save your template here.',
          },
          {
            target: '[data-tour="send-test-email"]',
            content: 'Send a test email to preview your template.',
          },
        ]}
        showSkipButton
        showProgress
        continuous
        run={tourRun}
        callback={data => {
          if (data.status === 'finished' || data.status === 'skipped') setTourRun(false);
        }}
        styles={{
          options: {
            zIndex: 3000,
            primaryColor: '#0B2D53',
            backgroundColor: '#fff',
            textColor: '#0B2D53',
            arrowColor: '#0B2D53',
            overlayColor: 'rgba(11,45,83,0.2)',
          },
          tooltip: {
            color: '#0B2D53',
            backgroundColor: '#fff',
            border: '1px solid #0B2D53',
            borderRadius: 8,
            fontWeight: 500,
          },
          buttonNext: {
            backgroundColor: '#0B2D53',
            color: '#fff',
          },
          buttonBack: {
            color: '#0B2D53',
          },
          buttonSkip: {
            color: '#0B2D53',
          },
          buttonClose: {
            color: '#0B2D53',
          },
        }}
      />
      {/* Demo session warning banner */}
      {isDemoUser && demoBannerOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            zIndex: 2000,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Alert
            severity="warning"
            icon={false}
            sx={{
              mt:1,
              borderRadius: 2,
              background: '#DD7410',
              color: '#fff',
              alignItems: 'center',
              fontWeight: 500,
              fontSize: 15,
              pointerEvents: 'auto',
            }}
            action={
              <IconButton
                aria-label="close"
                size="small"
                onClick={() => setDemoBannerOpen(false)}
                sx={{ ml: 1, color: 'inherit' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            This is a <b>demo session</b>. All data will be refreshed every 15 minutes.
          </Alert>
        </Box>
      )}
      <InspectorDrawer onStartTour={handleStartTour} />
      <SamplesDrawer refreshSignal={refreshSignal} setRefreshSignal={setRefreshSignal}/>

      {/* User info header */}
      {isAuthenticated && user && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1000,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            p: 1,
            boxShadow: 2,
          }}
        >
        </Box>
      )}

      <Stack
        sx={{
          marginRight: inspectorDrawerOpen ? `${INSPECTOR_DRAWER_WIDTH}px` : 0,
          marginLeft: samplesDrawerOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0,
          transition: [marginLeftTransition, marginRightTransition].join(', '),
        }}
      >
        <TemplatePanel setRefreshSignal={setRefreshSignal} />
      </Stack>
    </>
  );
}
