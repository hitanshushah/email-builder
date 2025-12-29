import React from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

export type ContextMenuLevel = 'file' | 'template' | 'category' | 'template-in-category';

interface ContextMenuButtonProps {
  level: ContextMenuLevel;
  onRename?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onRemoveFromCategory?: () => void;
}

const ContextMenuButton: React.FC<ContextMenuButtonProps> = ({
  level,
  onRename,
  onDelete,
  onCopy,
  onRemoveFromCategory,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton size="small" onClick={handleClick} aria-label="more actions">
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {(level === 'file' || level === 'template' || level === 'category' || level === 'template-in-category') && (
          <MenuItem onClick={() => { handleClose(); onRename && onRename(); }}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Rename" />
          </MenuItem>
        )}
        {(level === 'file' || level === 'template' || level === 'category' || level === 'template-in-category') && (
          <MenuItem onClick={() => { handleClose(); onDelete && onDelete(); }}>
            <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Delete" />
          </MenuItem>
        )}
        {level === 'file' && (
          <MenuItem onClick={() => { handleClose(); onCopy && onCopy(); }}>
            <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Copy" />
          </MenuItem>
        )}
        {level === 'template-in-category' && (
          <MenuItem onClick={() => { handleClose(); onRemoveFromCategory && onRemoveFromCategory(); }}>
            <ListItemIcon><RemoveCircleOutlineIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Remove from Category" />
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default ContextMenuButton; 