import React from 'react';
import {
  Archive,
  Database,
  File,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  Map,
  Settings,
  Table,
} from 'lucide-react';
import { getExplorerFileKind } from './fileSemantics';


export interface FileIconProps {
  filename: string;
  isFolder?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}


const getFileIcon = (filename: string, isFolder: boolean = false) => {
  const kind = getExplorerFileKind(filename, isFolder);

  if (kind === 'folder') return Folder;
  if (kind === 'script' || kind === 'notebook') return FileCode;
  if (kind === 'query' || kind === 'database') return Database;
  if (kind === 'config' || kind === 'json') return Settings;
  if (kind === 'table') return Table;
  if (kind === 'geo-vector' || kind === 'geo-package' || kind === 'shape-main') return Map;
  if (kind === 'shape-sidecar') return FileText;
  if (kind === 'archive') return Archive;
  if (kind === 'image') return FileImage;
  if (kind === 'media') return FileVideo;
  if (kind === 'text') return FileText;
  return File;
};


const getFileIconColor = (filename: string, isFolder: boolean = false) => {
  const kind = getExplorerFileKind(filename, isFolder);

  if (kind === 'folder') return 'var(--syn-status-warning)';
  if (kind === 'geo-vector' || kind === 'geo-package' || kind === 'shape-main') return 'var(--syn-status-valid)';
  if (kind === 'shape-sidecar') return 'var(--syn-status-info)';
  if (kind === 'table') return 'var(--syn-status-info)';
  if (kind === 'script' || kind === 'notebook' || kind === 'query') return 'var(--syn-interaction-active)';
  if (kind === 'config' || kind === 'json') return 'var(--syn-text-secondary)';
  if (kind === 'database') return 'var(--syn-text-secondary)';
  if (kind === 'archive') return 'var(--syn-text-muted)';
  if (kind === 'image') return 'var(--syn-status-demo)';
  if (kind === 'media') return 'var(--syn-status-demo)';
  if (kind === 'text') return 'var(--syn-text-secondary)';
  return 'var(--syn-text-muted)';
};

export const FileIcon: React.FC<FileIconProps> = ({
  filename,
  isFolder = false,
  size = 16,
  className = '',
  style = {},
}) => {
  const IconComponent = getFileIcon(filename, isFolder);
  const iconColor = getFileIconColor(filename, isFolder);

  return (
    <IconComponent
      size={size}
      strokeWidth={1.5}
      className={className}
      style={{
        color: iconColor,
        flexShrink: 0,
        opacity: 0.85,
        transition: 'var(--syn-transition-medium)',
        ...style,
      }}
    />
  );
};

export default FileIcon;
