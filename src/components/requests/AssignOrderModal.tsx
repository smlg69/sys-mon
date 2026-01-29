// components/requests/AssignOrderModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { requestsApi } from "../../api/requests";
import { Order } from "../../api/requests";

interface AssignOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onAssign: (orderId: string | number, userName: string) => void;
}

const AssignOrderModal: React.FC<AssignOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onAssign,
}) => {
  const [user, setUser] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!order || !user.trim()) {
      setError("Выберите исполнителя");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Назначение заявки:", order.id, "на исполнителя:", user);

      // Используем requestsApi.assignOrder
      await requestsApi.assignOrder(order.id, "", user);

      // Вызываем callback
      onAssign(order.id, user);

      // Закрываем модальное окно
      onClose();
    } catch (err: any) {
      console.error("❌ Ошибка назначения заявки:", err);
      setError("Ошибка назначения заявки. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUser("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Назначить заявку в работу</Typography>
        {order && (
          <Typography variant="body2" color="text.secondary">
            Заявка #{order.id} - {order.type}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            select
            fullWidth
            label="Исполнитель *"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            disabled={loading}
            error={!!error}
            helperText={error}
          >
            <MenuItem value="Васильев М.С.">Васильев М.С.</MenuItem>
            <MenuItem value="Смирнов А.П.">Смирнов А.П.</MenuItem>
            <MenuItem value="Иванов П.К.">Иванов П.К.</MenuItem>
            <MenuItem value="Попов Д.В.">Попов Д.В.</MenuItem>
            <MenuItem value="Сидоров И.И.">Сидоров И.И.</MenuItem>
            <MenuItem value="Махмудов И.К.">Махмудов И.К.</MenuItem>
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading} variant="outlined">
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !user.trim()}
          variant="contained"
          color="primary"
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Назначение...
            </>
          ) : (
            "Назначить"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export { AssignOrderModal };