// components/access/AccessDevicesGrid.tsx
import React from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { ReportPagination } from "../reports/Pagination";
import { AccessDevice } from "../../types/access";
import { AccessDeviceCard } from "./AccessDeviceCard";

export interface AccessDevicesGridProps {
  devices: AccessDevice[];
  selectedDeviceId?: string;
  loading?: boolean;
  error?: string | null;
  onDeviceClick?: (deviceId: string) => void;
  onRefresh?: () => void;
  
  // Пагинация
  page?: number;
  rowsPerPage?: number;
  totalRows?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number) => void;
  
  // Конфигурация отображения
  columns?: number;
  compact?: boolean;
  showStatus?: boolean;
  showValue?: boolean;
}

export const AccessDevicesGrid: React.FC<AccessDevicesGridProps> = ({
  devices,
  selectedDeviceId,
  loading = false,
  error = null,
  onDeviceClick,
  onRefresh,
  
  // Пагинация
  page = 1,
  rowsPerPage = 9,
  totalRows = 0,
  onPageChange,
  onRowsPerPageChange,
  
  // Конфигурация
  columns = 3,
  compact = false,
  showStatus = true,
  showValue = true,
}) => {
  const getGridTemplateColumns = () => {
    return `repeat(${columns}, 1fr)`;
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100%",
        minHeight: 300 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100%",
        minHeight: 300,
        gap: 2 
      }}>
        <Typography variant="body1" color="error" align="center">
          {error}
        </Typography>
        {onRefresh && (
          <Button variant="outlined" startIcon={<Refresh />} onClick={onRefresh}>
            Повторить
          </Button>
        )}
      </Box>
    );
  }

  if (devices.length === 0) {
    return (
      <Box sx={{ 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100%",
        minHeight: 300,
        gap: 2 
      }}>
        <Typography variant="body1" color="text.secondary" align="center">
          Нет устройств для отображения
        </Typography>
        {onRefresh && (
          <Button variant="outlined" startIcon={<Refresh />} onClick={onRefresh}>
            Обновить
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Сетка устройств */}
      <Box sx={{ 
        display: "grid",
        gridTemplateColumns: getGridTemplateColumns(),
        gap: compact ? 1 : 2,
        flex: 1,
        mb: 2,
      }}>
        {devices.map((device) => (
          <AccessDeviceCard
            key={device.id}
            device={device}
            selected={device.id === selectedDeviceId}
            onClick={onDeviceClick}
            compact={compact}
            showStatus={showStatus}
            showValue={showValue}
          />
        ))}
      </Box>

      {/* Пагинация */}
      {totalRows > rowsPerPage && onPageChange && (
        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <ReportPagination
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={totalRows}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange || (() => {})}
            disabled={loading}
          />
        </Box>
      )}
    </Box>
  );
};