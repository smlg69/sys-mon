// components/reports/Pagination.tsx
import React from "react";
import {
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Typography,
} from "@mui/material";

interface PaginationProps {
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  disabled?: boolean;
}

export const ReportPagination: React.FC<PaginationProps> = ({
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  disabled = false,
}) => {
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  const handleRowsPerPageChange = (event: SelectChangeEvent<number>) => {
    onRowsPerPageChange(Number(event.target.value));
  };

  const startIndex = totalRows > 0 ? (page - 1) * rowsPerPage + 1 : 0;
  const endIndex = Math.min(page * rowsPerPage, totalRows);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 2,
        borderTop: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Строк на странице:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 100 }} disabled={disabled}>
          <InputLabel id="rows-per-page-label">Строк</InputLabel>
          <Select
            labelId="rows-per-page-label"
            id="rows-per-page-select"
            value={rowsPerPage}
            label="Строк"
            onChange={handleRowsPerPageChange}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          {startIndex}-{endIndex} из {totalRows}
        </Typography>
      </Box>
      
      {totalPages > 0 && (
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
          size="medium"
          showFirstButton
          showLastButton
          disabled={disabled}
        />
      )}
    </Box>
  );
};