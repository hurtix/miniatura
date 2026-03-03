'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ThumbnailConfig } from '@/types/thumbnail';
import { Button } from '@/components/ui/button';

interface ThumbnailPreviewProps {
  config: ThumbnailConfig;
  className?: string;
}

export function ThumbnailPreview({ config, className = '' }: ThumbnailPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    drawThumbnail();
  }, [config]);

  const drawThumbnail = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    canvas.width = config.width;
    canvas.height = config.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, config.width, config.height);

    // Dibujar imagen de fondo si existe
    if (config.backgroundImage) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            // Dibujar imagen de fondo ajustada al tamaño del canvas
            ctx.globalAlpha = config.backgroundOpacity || 1;
            ctx.drawImage(img, 0, 0, config.width, config.height);
            ctx.globalAlpha = 1;
            resolve();
          };
          img.onerror = () => {
            // Si falla la carga, usar color de fondo por defecto
            console.warn('No se pudo cargar la imagen de fondo:', config.backgroundImage);
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, config.width, config.height);
            resolve();
          };
          img.src = config.backgroundImage!; // Non-null assertion - checked above
        });
      } catch (error) {
        // Fallback en caso de error
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, config.width, config.height);
      }
    } else {
      // Fondo por defecto si no hay imagen
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, config.width, config.height);
    }

    // Dibujar overlay
    ctx.fillStyle = hexToRgba(config.overlayColor, config.overlayOpacity);
    ctx.fillRect(0, 0, config.width, config.height);

    // Configurar texto
    ctx.textBaseline = 'top';

    // Calcular área de texto combinada
    const titleMetrics = measureText(ctx, config.title, config.titleSize, config.titleFont, config.titleWeight);
    const subtitleMetrics = measureText(ctx, config.subtitle, config.subtitleSize, config.subtitleFont, config.subtitleWeight);
    
    // Calcular posición del contenedor de texto
    const containerY = (config.titlePosition.y / 100) * config.height;
    const containerPadding = 20;
    const textSpacing = 10;
    
    // Altura total del contenedor: título + espacio + subtítulo + padding
    const containerHeight = config.titleSize + textSpacing + config.subtitleSize + (containerPadding * 2);
    
    // Dibujar fondo del contenedor de texto (ancho completo)
    if (config.titleBackground && config.titleBackgroundOpacity > 0) {
      ctx.fillStyle = config.titleBackground;
      ctx.globalAlpha = config.titleBackgroundOpacity;
      ctx.fillRect(
        0, // Ancho completo
        containerY - containerPadding,
        config.width, // Ancho completo
        containerHeight
      );
      ctx.globalAlpha = 1;
    }

    // Calcular posición X según alineación
    let titleX = (config.titlePosition.x / 100) * config.width;
    let subtitleX = (config.subtitlePosition.x / 100) * config.width;
    
    // Dibujar título
    ctx.fillStyle = config.titleColor;
    ctx.font = `${config.titleWeight} ${config.titleSize}px ${config.titleFont}`;
    
    if (config.titlePosition.align === 'center') {
      ctx.textAlign = 'center';
      titleX = config.width / 2;
    } else if (config.titlePosition.align === 'right') {
      ctx.textAlign = 'right';
      titleX = config.width - containerPadding;
    } else {
      ctx.textAlign = 'left';
      titleX = containerPadding;
    }
    
    ctx.fillText(config.title, titleX, containerY);

    // Dibujar subtítulo (misma alineación que el título)
    ctx.fillStyle = config.subtitleColor;
    ctx.font = `${config.subtitleWeight} ${config.subtitleSize}px ${config.subtitleFont}`;
    
    if (config.subtitlePosition.align === 'center') {
      ctx.textAlign = 'center';
      subtitleX = config.width / 2;
    } else if (config.subtitlePosition.align === 'right') {
      ctx.textAlign = 'right';
      subtitleX = config.width - containerPadding;
    } else {
      ctx.textAlign = 'left';
      subtitleX = containerPadding;
    }
    
    ctx.fillText(config.subtitle, subtitleX, containerY + config.titleSize + textSpacing);

    // Generar URL de preview
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(dataUrl);
  };

  const measureText = (ctx: CanvasRenderingContext2D, text: string, size: number, font: string, weight: number) => {
    ctx.font = `${weight} ${size}px ${font}`;
    const metrics = ctx.measureText(text);
    return {
      width: metrics.width,
      height: size, // Aproximación
      metrics
    };
  };

  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `miniatura-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      <div className="relative border rounded-lg overflow-hidden bg-muted">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
          style={{
            aspectRatio: `${config.width}/${config.height}`,
          }}
        />
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={downloadImage}
          variant="default"
          size="sm"
        >
          Descargar PNG
        </Button>
        <Button
          onClick={() => navigator.clipboard?.writeText(previewUrl)}
          variant="outline"
          size="sm"
        >
          Copiar URL
        </Button>
      </div>
    </div>
  );
}