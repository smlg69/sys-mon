// components/access/AccessDeviceDetail.tsx
import React from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Button,
} from "@mui/material";
import { History, Assignment } from "@mui/icons-material";
import { AccessDevice } from "../../types/access";
import { AccessDeviceIcon } from "./AccessDeviceIcon";

export interface AccessDeviceDetailProps {
  device: AccessDevice;
  activityData?: Array<{ timestamp: string; value: number }>;
  onHistoryClick?: () => void;
  onTaskClick?: () => void;
}

export const AccessDeviceDetail: React.FC<AccessDeviceDetailProps> = ({
  device,
  activityData,
  onHistoryClick,
  onTaskClick,
}) => {
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal": return "Норма";
      case "warning": return "Внимание";
      case "critical": return "Критично";
      default: return status;
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "Нет данных";
    return new Date(timestamp).toLocaleString("ru-RU");
  };

  return (
    <Box>
      {/* Заголовок */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <AccessDeviceIcon
          type={device.type}
          status={device.status}
          size="large"
          showStatus={true}
          tooltip={`${device.name} - ${getStatusText(device.status)}`}
        />
        <Box>
          <Typography variant="h6">{device.name}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Chip
              label={getStatusText(device.status)}
              color={
                device.status === "normal" ? "success" :
                device.status === "warning" ? "warning" : "error"
              }
              size="small"
            />
            <Chip label={device.type} variant="outlined" size="small" />
          </Box>
        </Box>
      </Box>

      {/* Текущее значение из графика */}
      {activityData && activityData.length > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "primary.light",
            color: "primary.contrastText",
          }}
        >
          <Typography variant="subtitle2">
            Текущая активность
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {activityData[activityData.length - 1]?.value.toFixed(0)}
            ед.
          </Typography>
          <Typography variant="caption">
            {activityData[activityData.length - 1]?.timestamp ? 
              new Date(activityData[activityData.length - 1].timestamp).toLocaleTimeString('ru-RU') : 
              'N/A'}
          </Typography>
        </Paper>
      )}

      {/* Детальная информация */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">
            Параметр
          </Typography>
          <Typography variant="body2">
            {device.param || "Н/Д"}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">
            Группа
          </Typography>
          <Typography variant="body2">
            {device.group || "Не указана"}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">
            Текущее значение
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {device.value || "Н/Д"}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">
            Статус
          </Typography>
          <Typography variant="body2">
            {getStatusText(device.status)}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">
            Местоположение
          </Typography>
          <Typography variant="body2">
            {device.location || "Не указано"}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">
            Последнее обновление
          </Typography>
          <Typography variant="body2">
            {formatTimestamp(device.timestamp)}
          </Typography>
        </Grid>
        
        {device.description && (
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">
              Описание
            </Typography>
            <Typography variant="body2">
              {device.description}
            </Typography>
          </Grid>
        )}
      </Grid>

      {/* Кнопки действий */}
      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
        <Button
          size="small"
          startIcon={<History />}
          variant="outlined"
          onClick={onHistoryClick}
        >
          История
        </Button>
        <Button
          size="small"
          startIcon={<Assignment />}
          variant="outlined"
          onClick={onTaskClick}
        >
          Заявка
        </Button>
      </Box>
    </Box>
  );
};