// components/access/AccessDeviceTableRow.tsx
import React from "react";
import { TableRow, TableCell, Typography, Chip, Box } from "@mui/material";
import { AccessDevice } from "../../types/access";
import { AccessDeviceIcon } from "./AccessDeviceIcon";

export interface AccessDeviceTableRowProps {
  device: AccessDevice;
  selected?: boolean;
  onClick?: (deviceId: string) => void;
  columns?: {
    showParam?: boolean;
    showName?: boolean;
    showType?: boolean;
    showStatus?: boolean;
    showValue?: boolean;
    showLocation?: boolean;
    showTimestamp?: boolean;
  };
}

export const AccessDeviceTableRow: React.FC<AccessDeviceTableRowProps> = ({
  device,
  selected = false,
  onClick,
  columns = {
    showParam: true,
    showName: true,
    showType: true,
    showStatus: true,
    showValue: true,
    showLocation: true,
    showTimestamp: true,
  },
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

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "Н/Д";
    return new Date(timestamp).toLocaleString("ru-RU");
  };

  return (
    <TableRow
      hover
      onClick={handleClick}
      sx={{
        cursor: onClick ? "pointer" : "default",
        backgroundColor: selected ? "action.selected" : "inherit",
        "&:hover": onClick ? { backgroundColor: "action.hover" } : {},
      }}
    >
      {columns.showParam && (
        <TableCell>
          <Chip label={device.param || device.id} size="small" variant="outlined" />
        </TableCell>
      )}
      
      {columns.showName && (
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessDeviceIcon
              type={device.type}
              status={device.status}
              size="small"
              showStatus={false}
            />
            <Typography variant="body1" fontWeight="medium">
              {device.name}
            </Typography>
          </Box>
        </TableCell>
      )}
      
      {columns.showType && (
        <TableCell>
          <Chip label={device.type} size="small" variant="outlined" />
        </TableCell>
      )}
      
      {columns.showStatus && (
        <TableCell>
          <Chip
            label={getStatusText(device.status)}
            color={
              device.status === "normal" ? "success" :
              device.status === "warning" ? "warning" : "error"
            }
            size="small"
          />
        </TableCell>
      )}
      
      {columns.showValue && (
        <TableCell>
          <Typography variant="body2">{device.value}</Typography>
        </TableCell>
      )}
      
      {columns.showLocation && (
        <TableCell>
          <Typography variant="body2">{device.location || "Не указано"}</Typography>
        </TableCell>
      )}
      
      {columns.showTimestamp && device.timestamp && (
        <TableCell>
          <Typography variant="caption">
            {formatTimestamp(device.timestamp)}
          </Typography>
        </TableCell>
      )}
    </TableRow>
  );
};