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

  if (kind === 'folder') return '#F59E0B';
  if (kind === 'geo-vector' || kind === 'geo-package' || kind === 'shape-main') return '#2DD4BF';
  if (kind === 'shape-sidecar') return '#14B8A6';
  if (kind === 'table') return '#60A5FA';
  if (kind === 'script' || kind === 'notebook' || kind === 'query') return '#FBBF24';
  if (kind === 'config' || kind === 'json') return '#8C8579';
  if (kind === 'database') return '#A8A29E';
  if (kind === 'archive') return '#8C8579';
  if (kind === 'image') return '#FDE68A';
  if (kind === 'media') return '#D6D3D1';
  if (kind === 'text') return '#A8A29E';
  return '#A8A29E';
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
