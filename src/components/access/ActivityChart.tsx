// components/access/ActivityChart.tsx
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Box, Chip, CircularProgress } from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";

export interface ActivityDataPoint {
  timestamp: string;
  value: number;
  type: string;
}

interface ActivityChartProps {
  data: ActivityDataPoint[];
  title: string;
  color?: string;
  unit?: string;
  isLoading?: boolean;
}

export const ActivityChart: React.FC<ActivityChartProps> = React.memo(({
  data,
  title,
  color = "#1976d2",
  unit = "",
  isLoading = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState({
    min: 0,
    max: 0,
    current: 0,
    avg: 0,
    trend: 0,
  });

  // Ограничиваем данные 50 точками для читаемости
  const limitedData = useMemo(() => {
    if (data.length <= 50) return data;
    return data.slice(-50); // Берем последние 50 точек
  }, [data]);

  const drawChart = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (limitedData.length === 0) {
      ctx.fillStyle = "#999";
      ctx.font = "14px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Нет данных для отображения", canvas.width / 2, canvas.height / 2);
      return;
    }

    const values = limitedData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const currentVal = limitedData[limitedData.length - 1]?.value || 0;
    const avgVal = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = limitedData.length > 1 ? currentVal - limitedData[0].value : 0;
    
    setStats({ min: minVal, max: maxVal, current: currentVal, avg: avgVal, trend });

    const padding = { top: 40, right: 30, bottom: 50, left: 60 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;
    const valueRange = maxVal - minVal || 1;

    // Сетка
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    
    // Горизонтальные линии
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i * chartHeight) / 5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    // Вертикальные линии (не более 10)
    const verticalLines = Math.min(limitedData.length, 10);
    for (let i = 0; i <= verticalLines; i++) {
      const x = padding.left + (i * chartWidth) / verticalLines;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
    }

    // График
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    limitedData.forEach((point, index) => {
      const x = padding.left + (index / Math.max(limitedData.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.value - minVal) / valueRange) * chartHeight;

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Точки только для первых и последних 5 точек
    ctx.fillStyle = color;
    const showPoints = limitedData.length <= 20; // Показываем точки только если мало данных
    if (showPoints) {
      limitedData.forEach((point, index) => {
        const x = padding.left + (index / Math.max(limitedData.length - 1, 1)) * chartWidth;
        const y = padding.top + chartHeight - ((point.value - minVal) / valueRange) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Последняя точка (всегда показываем)
    if (limitedData.length > 0) {
      const lastIndex = limitedData.length - 1;
      const x = padding.left + chartWidth;
      const y = padding.top + chartHeight - ((limitedData[lastIndex].value - minVal) / valueRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ff4444";
      ctx.fill();
      
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Подписи осей
    ctx.fillStyle = "#333";
    ctx.font = "bold 14px Inter";
    ctx.textAlign = "center";
    ctx.fillText(title, canvas.width / 2, padding.top - 15);
    
    // Подписи значений
    ctx.font = "12px Inter";
    ctx.textAlign = "right";
    ctx.fillStyle = "#666";
    ctx.fillText(`${maxVal.toFixed(0)}${unit}`, padding.left - 10, padding.top + 5);
    ctx.fillText(`${minVal.toFixed(0)}${unit}`, padding.left - 10, padding.top + chartHeight);
    
    // Подпись количества точек
    ctx.textAlign = "left";
    ctx.fillStyle = "#888";
    ctx.fillText(`Точек: ${limitedData.length}/${data.length}`, padding.left, padding.top + chartHeight + 20);

  }, [limitedData, title, color, unit, data.length]);

  useEffect(() => {
    drawChart();
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        <Box sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
        }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      <Box sx={{ 
        position: "absolute", 
        bottom: 10, 
        left: 10, 
        display: "flex", 
        gap: 1 
      }}>
        <Chip 
          size="small"
          icon={<ArrowDownward />}
          label={`${stats.min.toFixed(0)}${unit}`}
          variant="outlined"
          sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        />
        <Chip 
          size="small"
          icon={stats.trend > 0 ? <TrendingUp /> : <TrendingDown />}
          label={`${stats.current.toFixed(0)}${unit}`}
          color={stats.trend > 0 ? "success" : stats.trend < 0 ? "error" : "default"}
          sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        />
        <Chip 
          size="small"
          icon={<ArrowUpward />}
          label={`${stats.max.toFixed(0)}${unit}`}
          variant="outlined"
          sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        />
      </Box>
    </Box>
  );
});