// components/access/AccessDeviceCard.tsx
import React from "react";
import { Card, CardContent, Typography, Chip, Box } from "@mui/material";
import { AccessDevice } from "../../types/access";
import { AccessDeviceIcon } from "./AccessDeviceIcon";

export interface AccessDeviceCardProps {
  device: AccessDevice;
  selected?: boolean;
  onClick?: (deviceId: string) => void;
  showStatus?: boolean;
  showValue?: boolean;
  compact?: boolean;
}

export const AccessDeviceCard: React.FC<AccessDeviceCardProps> = ({
  device,
  selected = false,
  onClick,
  showStatus = true,
  showValue = true,
  compact = false,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(device.id);
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal": return "Норма";
      case "warning": return "Внимание";
      case "critical": return "Критично";
      default: return status;
    }
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.3s",
        border: selected ? "2px solid #1976d2" : "1px solid #e0e0e0",
        backgroundColor: selected ? "primary.50" : "white",
        position: "relative",
        "&:hover": onClick ? {
          transform: "translateY(-2px)",
          boxShadow: 4,
        } : {},
        minHeight: compact ? "100px" : "120px",
        height: "100%",
      }}
    >
      <CardContent sx={{ 
        p: compact ? 1.5 : 2, 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        height: "100%",
      }}>
        <AccessDeviceIcon
          type={device.type}
          status={device.status}
          size={compact ? "small" : "medium"}
          showStatus={showStatus}
          tooltip={`${device.name} - ${getStatusText(device.status)}`}
        />
        
        <Typography 
          variant={compact ? "caption" : "body2"} 
          fontWeight="bold" 
          align="center" 
          noWrap
          sx={{ mt: compact ? 0.5 : 1, mb: compact ? 0.5 : 1 }}
        >
          {device.name}
        </Typography>
        
        {!compact && device.param && (
          <Typography variant="caption" color="text.secondary" align="center" noWrap>
            {device.param}
          </Typography>
        )}
        
        {showStatus && (
          <Chip
            size="small"
            label={getStatusText(device.status)}
            color={
              device.status === "normal" ? "success" :
              device.status === "warning" ? "warning" : "error"
            }
            sx={{ mt: compact ? 0.5 : 1 }}
          />
        )}
        
        {showValue && device.value && !compact && (
          <Typography 
            variant="caption" 
            color="primary" 
            align="center" 
            sx={{ mt: 0.5 }}
          >
            {device.value}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};