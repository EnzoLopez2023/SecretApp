// src/components/VersionDisplay.tsx
// Component to display version information in the app

import { useState, useEffect } from 'react';
import { Chip, Tooltip } from '@mui/material';
import { Info } from '@mui/icons-material';
import { getVersionInfo, formatVersionDisplay, type VersionInfo } from '../utils/version';

interface VersionDisplayProps {
  variant?: 'chip' | 'text';
  size?: 'small' | 'medium';
}

export default function VersionDisplay({ variant = 'chip', size = 'small' }: VersionDisplayProps) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    getVersionInfo().then(setVersionInfo);
  }, []);

  if (!versionInfo) {
    return null;
  }

  const displayText = formatVersionDisplay(versionInfo);
  const tooltipText = `Version: ${versionInfo.fullVersion}\nBuild: ${versionInfo.build}\nCommit: ${versionInfo.commit}\nBranch: ${versionInfo.branch}\nBuilt: ${new Date(versionInfo.timestamp).toLocaleString()}`;

  if (variant === 'chip') {
    return (
      <Tooltip title={tooltipText} arrow>
        <Chip
          icon={<Info />}
          label={`v${versionInfo.fullVersion}`}
          size={size}
          variant="outlined"
          sx={{ 
            cursor: 'help',
            fontSize: '0.75rem',
            '& .MuiChip-icon': {
              fontSize: '0.875rem'
            }
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipText} arrow>
      <span style={{ 
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        color: 'inherit',
        cursor: 'help',
        opacity: 0.8
      }}>
        {displayText}
      </span>
    </Tooltip>
  );
}