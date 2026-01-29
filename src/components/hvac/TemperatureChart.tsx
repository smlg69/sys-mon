// components/hvac/TemperatureChart.tsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Box, Chip, CircularProgress } from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import { TemperatureDataPoint } from "../../types/hvac";

interface TemperatureChartProps {
  data: TemperatureDataPoint[];
  title: string;
  color?: string;
  unit?: string;
  isLoading?: boolean;
}

export const TemperatureChart: React.FC<TemperatureChartProps> = React.memo(
  ({ data, title, color = "#1976d2", unit = "°C", isLoading = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stats, setStats] = useState({
      min: 0,
      max: 0,
      current: 0,
      avg: 0,
      trend: 0,
    });

    const drawChart = useCallback(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (data.length === 0) {
        ctx.fillStyle = "#999";
        ctx.font = "14px Inter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "Нет данных для отображения",
          canvas.width / 2,
          canvas.height / 2
        );
        return;
      }

      const temps = data.map((d) => d.temperature);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      const currentTemp = data[data.length - 1]?.temperature || 0;
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      const trend = data.length > 1 ? currentTemp - data[0].temperature : 0;

      setStats({
        min: minTemp,
        max: maxTemp,
        current: currentTemp,
        avg: avgTemp,
        trend,
      });

      const padding = { top: 40, right: 30, bottom: 50, left: 60 };
      const chartWidth = canvas.width - padding.left - padding.right;
      const chartHeight = canvas.height - padding.top - padding.bottom;
      const tempRange = maxTemp - minTemp || 1;

      // Сетка
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 1;

      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (i * chartHeight) / 5;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
      }

      // График
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      data.forEach((point, index) => {
        const x =
          padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
        const y =
          padding.top +
          chartHeight -
          ((point.temperature - minTemp) / tempRange) * chartHeight;

        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      // Точки
      ctx.fillStyle = color;
      if (data.length <= 20) {
        data.forEach((point, index) => {
          const x =
            padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
          const y =
            padding.top +
            chartHeight -
            ((point.temperature - minTemp) / tempRange) * chartHeight;

          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Последняя точка
      if (data.length > 0) {
        const lastIndex = data.length - 1;
        const x = padding.left + chartWidth;
        const y =
          padding.top +
          chartHeight -
          ((data[lastIndex].temperature - minTemp) / tempRange) * chartHeight;

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ff4444";
        ctx.fill();

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Подписи
      ctx.fillStyle = "#333";
      ctx.font = "bold 14px Inter";
      ctx.textAlign = "center";
      ctx.fillText(title, canvas.width / 2, padding.top - 15);

      ctx.font = "12px Inter";
      ctx.textAlign = "right";
      ctx.fillStyle = "#666";
      ctx.fillText(
        `${maxTemp.toFixed(1)}${unit}`,
        padding.left - 10,
        padding.top + 5
      );
      ctx.fillText(
        `${minTemp.toFixed(1)}${unit}`,
        padding.left - 10,
        padding.top + chartHeight
      );
    }, [data, title, color, unit]);

    useEffect(() => {
      drawChart();
      const handleResize = () => drawChart();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [drawChart]);

    return (
      <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#f9f9f9",
            borderRadius: "4px",
          }}
        />

        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}

        <Box
          sx={{
            position: "absolute",
            bottom: 10,
            left: 10,
            display: "flex",
            gap: 1,
          }}
        >
          <Chip
            size="small"
            icon={<ArrowDownward />}
            label={`${stats.min.toFixed(1)}${unit}`}
            variant="outlined"
            sx={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          />
          <Chip
            size="small"
            icon={stats.trend > 0 ? <TrendingUp /> : <TrendingDown />}
            label={`${stats.current.toFixed(1)}${unit}`}
            color={stats.trend > 0 ? "success" : stats.trend < 0 ? "error" : "default"}
            sx={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          />
          <Chip
            size="small"
            icon={<ArrowUpward />}
            label={`${stats.max.toFixed(1)}${unit}`}
            variant="outlined"
            sx={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          />
        </Box>
      </Box>
    );
  }
);