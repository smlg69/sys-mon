// components/access/AccessDeviceIcon.tsx
import React from "react";
import { Avatar, Tooltip } from "@mui/material";
import {
  Build as BuildIcon,
  SensorDoor,
  Lock,
  Dashboard,
  Settings,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle,
} from "@mui/icons-material";

export interface AccessDeviceIconProps {
  type: string;
  status?: "normal" | "warning" | "critical";
  size?: "small" | "medium" | "large";
  showStatus?: boolean;
  tooltip?: string;
}

const getIconByType = (type: string) => {
  const typeLower = type.toLowerCase();
  
  if (typeLower.includes("controller") || typeLower.includes("контроллер") || typeLower.includes("gsm")) {
    return <BuildIcon />;
  }
  if (typeLower.includes("reader") || typeLower.includes("считыватель")) {
    return <SensorDoor />;
  }
  if (typeLower.includes("lock") || typeLower.includes("замок")) {
    return <Lock />;
  }
  if (typeLower.includes("server") || typeLower.includes("сервер")) {
    return <Dashboard />;
  }
  if (typeLower.includes("panel") || typeLower.includes("панель")) {
    return <Settings />;
  }
  return <BuildIcon />;
};

const getStatusIcon = (status?: "normal" | "warning" | "critical") => {
  switch (status) {
    case "normal": return <CheckCircle fontSize="small" />;
    case "warning": return <WarningIcon fontSize="small" />;
    case "critical": return <ErrorIcon fontSize="small" />;
    default: return null;
  }
};

const getStatusColor = (status?: "normal" | "warning" | "critical") => {
  switch (status) {
    case "normal": return "success";
    case "warning": return "warning";
    case "critical": return "error";
    default: return "default";
  }
};

const getSizeConfig = (size: "small" | "medium" | "large") => {
  switch (size) {
    case "small": return { width: 32, height: 32, iconSize: 16 };
    case "medium": return { width: 40, height: 40, iconSize: 20 };
    case "large": return { width: 60, height: 60, iconSize: 30 };
    default: return { width: 40, height: 40, iconSize: 20 };
  }
};

export const AccessDeviceIcon: React.FC<AccessDeviceIconProps> = ({
  type,
  status,
  size = "medium",
  showStatus = true,
  tooltip,
}) => {
  const { width, height } = getSizeConfig(size);
  const statusColor = getStatusColor(status);
  const icon = getIconByType(type);
  const statusIcon = showStatus ? getStatusIcon(status) : null;

  const avatar = (
    <Avatar
      sx={{
        width,
        height,
        bgcolor: `${statusColor}.light`,
        color: `${statusColor}.dark`,
        position: 'relative',
      }}
    >
      {icon}
      {showStatus && statusIcon && (
        <Avatar
          sx={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 20,
            height: 20,
            bgcolor: `${statusColor}.main`,
            color: `${statusColor}.contrastText`,
            border: '2px solid white',
          }}
        >
          {statusIcon}
        </Avatar>
      )}
    </Avatar>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip}>
        {avatar}
      </Tooltip>
    );
  }

  return avatar;
};