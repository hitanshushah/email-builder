import React from 'react';

import { Button } from '@mui/material';

export default function SidebarButton({ href, children, selected, onClick }: { href: string; children: JSX.Element | string; selected?: boolean; onClick?: () => void }) {
  return (
    <Button
      size="small"
      href={href}
      onClick={onClick}
      variant={selected ? 'contained' : 'text'}
      color={selected ? 'primary' : 'inherit'}
      style={{ textAlign: 'left', width: '100%' }}
    >
      {children}
    </Button>
  );
}
