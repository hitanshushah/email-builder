import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function CustomTooltip({
  step,
  index,
  size,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}) {
  const isFirstStep = index === 0;
  const isLastStep = index === size - 1;

  return (
    <Box
      {...tooltipProps}
      sx={{
        background: '#fff',
        border: '1px solid #0B2D53',
        borderRadius: 2,
        p: 2,
        maxWidth: 500,
        position: 'relative',
        boxShadow: 3,
        zIndex: 3001,
      }}
    >
      {/* Skip and Close in same row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          {...skipProps}
          size="small"
          sx={{
            color: '#666',
            textTransform: 'none',
            fontSize: 14,
            pl: 0,
            minWidth: 'auto',
          }}
        >
          Skip
        </Button>

        <IconButton
          {...closeProps}
          size="small"
          sx={{
            color: '#0B2D53',
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Tooltip text */}
      <Typography
        sx={{
          color: '#0B2D53',
          fontWeight: 500,
          fontSize: 15,
          my: 2,
          textAlign: 'center',
        }}
      >
        {step.content}
      </Typography>

      {/* Buttons row */}
      <Stack direction="row" justifyContent="flex-end" spacing={1} alignItems="center">
        {!isFirstStep && (
          <Button
            {...backProps}
            variant='outlined'
            size="small"
            sx={{borderColor: '#0B2D53', color: '#0B2D53', textTransform: 'none', '&.MuiButton-root': { mr: 10 }}}>
            Back
          </Button>
        )}
        <Button
          {...primaryProps}
          size="small"
          variant="contained"
          sx={{
            backgroundColor: '#0B2D53',
            color: '#fff',
            textTransform: 'none',
            px: 2,
            '&:hover': { backgroundColor: '#08325a' },
          }}
        >
          {isLastStep ? 'Finish' : `Next (Step ${index + 1} of ${size})`}
        </Button>
      </Stack>

      {/* Don't show again */}
      <Button
        size="small"
        sx={{
          mt: 1,
          fontSize: 12,
          color: '#666',
          textTransform: 'none',
          minWidth: 0,
          display: 'block',
        }}
        onClick={() => {
          console.log("Don't show again clicked");
        }}
      >
        Don’t show again
      </Button>
    </Box>
  );
}
