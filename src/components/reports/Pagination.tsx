// components/reports/Pagination.tsx
import React from "react";
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { FirstPage, LastPage, ChevronLeft, ChevronRight } from "@mui/icons-material";

interface ReportPaginationProps {
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  disabled?: boolean;
  rowsPerPageOptions?: number[]; // Добавляем опцию кастомных значений
}

export const ReportPagination: React.FC<ReportPaginationProps> = ({
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  disabled = false,
  rowsPerPageOptions = [10, 25, 50, 100], // Дефолтные значения
}) => {
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startRow = (page - 1) * rowsPerPage + 1;
  const endRow = Math.min(page * rowsPerPage, totalRows);

  const handleRowsPerPageChange = (event: SelectChangeEvent<number>) => {
    const newRowsPerPage = Number(event.target.value);
    onRowsPerPageChange(newRowsPerPage);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        borderTop: "1px solid #e0e0e0",
        backgroundColor: "#f9f9f9",
      }}
    >
      {/* Левая часть: строк на странице */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Строк на странице:
        </Typography>
        <Select
          value={rowsPerPage}
          onChange={handleRowsPerPageChange}
          size="small"
          disabled={disabled}
          sx={{ minWidth: 80 }}
        >
          {rowsPerPageOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Центральная часть: информация */}
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {startRow}-{endRow} из {totalRows}
        </Typography>
      </Box>

      {/* Правая часть: навигация по страницам */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={() => onPageChange(1)}
          disabled={disabled || page === 1}
          size="small"
        >
          <FirstPage />
        </IconButton>
        <IconButton
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page === 1}
          size="small"
        >
          <ChevronLeft />
        </IconButton>

        <Typography variant="body2" sx={{ mx: 2 }}>
          Страница {page} из {totalPages}
        </Typography>

        <IconButton
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page === totalPages}
          size="small"
        >
          <ChevronRight />
        </IconButton>
        <IconButton
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || page === totalPages}
          size="small"
        >
          <LastPage />
        </IconButton>
      </Box>
    </Box>
  );
};