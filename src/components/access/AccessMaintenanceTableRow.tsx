// components/access/AccessMaintenanceTableRow.tsx
import React from "react";
import { TableRow, TableCell, Typography, Chip, Box, Avatar } from "@mui/material";
import { AccessMaintenanceTask } from "../../types/access";
import { AccessDeviceIcon } from "./AccessDeviceIcon";

export interface AccessMaintenanceTableRowProps {
  task: AccessMaintenanceTask;
  relatedDevice?: {
    name: string;
    type: string;
    status: "normal" | "warning" | "critical";
  };
  onClick?: (taskId: string) => void;
}

export const AccessMaintenanceTableRow: React.FC<AccessMaintenanceTableRowProps> = ({
  task,
  relatedDevice,
  onClick,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(task.id);
    }
  };

  const getTaskStatusInfo = (action: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('выполнено') || actionLower.includes('завершено')) {
      return { label: 'Выполнено', color: 'success' as const };
    } else if (actionLower.includes('запланировано') || actionLower.includes('план')) {
      return { label: 'Запланировано', color: 'info' as const };
    } else if (actionLower.includes('задерж') || actionLower.includes('отложен')) {
      return { label: 'Задержка', color: 'warning' as const };
    } else if (actionLower.includes('отмен') || actionLower.includes('отклонен')) {
      return { label: 'Отменено', color: 'error' as const };
    } else if (actionLower.includes('в работе') || actionLower.includes('выполняется')) {
      return { label: 'В работе', color: 'primary' as const };
    } else {
      return { label: action, color: 'default' as const };
    }
  };

  const plannedDate = new Date(task.taskDate);
  const isOverdue = task.realDate === null && plannedDate < new Date();
  const statusInfo = getTaskStatusInfo(task.action);

  return (
    <TableRow
      hover
      onClick={handleClick}
      sx={{
        cursor: onClick ? "pointer" : "default",
        backgroundColor: isOverdue ? '#fff8e1' : 'inherit',
        "&:hover": onClick ? { backgroundColor: isOverdue ? '#fff5d6' : 'action.hover' } : {},
      }}
    >
      <TableCell>
        <Chip
          label={`#${task.id}`}
          size="small"
          variant="outlined"
        />
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {relatedDevice && (
            <AccessDeviceIcon
              type={relatedDevice.type}
              status={relatedDevice.status}
              size="small"
              showStatus={false}
            />
          )}
          <Typography variant="body1">
            {task.device}
          </Typography>
        </Box>
      </TableCell>
      
      <TableCell>
        <Chip
          label={task.type}
          size="small"
          variant="outlined"
        />
      </TableCell>
      
      <TableCell>{task.task}</TableCell>
      
      <TableCell>
        <Box>
          <Typography variant="body2">
            {plannedDate.toLocaleDateString("ru-RU")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {plannedDate.toLocaleTimeString("ru-RU", {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
          {isOverdue && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
              Просрочено
            </Typography>
          )}
        </Box>
      </TableCell>
      
      <TableCell>
        <Chip
          label={statusInfo.label}
          color={statusInfo.color}
          size="small"
        />
      </TableCell>
      
      <TableCell>{task.user}</TableCell>
      
      <TableCell>
        {task.realDate ? (
          <Typography variant="body2">
            {new Date(task.realDate).toLocaleDateString("ru-RU")}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            Не выполнено
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
};