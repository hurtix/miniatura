'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ThumbnailConfig } from '@/types/thumbnail';
import { Button } from '@/components/ui/button';
import { Clipboard, ClipboardCopyIcon, Copy, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ThumbnailPreviewProps {
  config: ThumbnailConfig;
  className?: string;
}

export function ThumbnailPreview({ config, className = '' }: ThumbnailPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewScale, setPreviewScale] = useState<1 | 2>(1); // 1x = 200x140, 2x = 400x280

  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const measureText = (ctx: CanvasRenderingContext2D, text: string, size: number, font: string, weight: number) => {
    ctx.font = `${weight} ${size}px ${font}`;
    const metrics = ctx.measureText(text);
    return {
      width: metrics.width,
      height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    };
  };

  const drawThumbnail = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar dimensiones de preview (como se verá en Moodle)
    const moodleWidth = 200;
    const moodleHeight = 140;
    const previewWidth = moodleWidth * previewScale; // 200 o 400
    const previewHeight = moodleHeight * previewScale; // 140 o 280
    
    // Factor de escala desde el tamaño real (600x420) al preview
    const scaleX = previewWidth / config.width;
    const scaleY = previewHeight / config.height;

    // Configurar canvas
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    // Aplicar transformación de escala
    ctx.save();
    ctx.scale(scaleX, scaleY);

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
            ctx.globalAlpha = 1;
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

    // Calcular posición X según alineación del título (subtítulo usa la misma)
    let titleX = containerPadding;
    let subtitleX = containerPadding;
    
    // Dibujar título
    ctx.fillStyle = config.titleColor;
    ctx.font = `${config.titleWeight} ${config.titleSize}px ${config.titleFont}`;
    
    if (config.titlePosition.align === 'center') {
      ctx.textAlign = 'center';
      titleX = config.width / 2;
      subtitleX = config.width / 2;
    } else if (config.titlePosition.align === 'right') {
      ctx.textAlign = 'right';
      titleX = config.width - containerPadding;
      subtitleX = config.width - containerPadding;
    } else {
      ctx.textAlign = 'left';
      titleX = containerPadding;
      subtitleX = containerPadding;
    }
    
    ctx.fillText(config.title, titleX, containerY);

    // Dibujar subtítulo (misma alineación que el título)
    ctx.fillStyle = config.subtitleColor;
    ctx.font = `${config.subtitleWeight} ${config.subtitleSize}px ${config.subtitleFont}`;
    // La alineación ya está configurada arriba
    
    ctx.fillText(config.subtitle, subtitleX, containerY + config.titleSize + textSpacing);

    // Restaurar contexto de transformación
    ctx.restore();

    // Generar URL de preview
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(dataUrl);
  }, [config, previewScale]);

  useEffect(() => {
    drawThumbnail();
  }, [drawThumbnail]);

  const drawFullSizeThumbnail = async (targetCanvas?: HTMLCanvasElement) => {
    const canvas = targetCanvas || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas para tamaño completo (600x420)
    canvas.width = 600;
    canvas.height = 420;

    // Limpiar canvas
    ctx.clearRect(0, 0, 600, 420);

    // Dibujar imagen de fondo si existe
    if (config.backgroundImage) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            // Dibujar imagen de fondo ajustada al tamaño del canvas
            ctx.globalAlpha = 1;
            ctx.drawImage(img, 0, 0, 600, 420);
            ctx.globalAlpha = 1;
            resolve();
          };
          img.onerror = () => {
            // Si falla la carga, usar color de fondo por defecto
            console.warn('No se pudo cargar la imagen de fondo:', config.backgroundImage);
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, 600, 420);
            resolve();
          };
          img.src = config.backgroundImage!;
        });
      } catch (error) {
        // Fallback en caso de error
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, 600, 420);
      }
    } else {
      // Fondo por defecto si no hay imagen
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, 600, 420);
    }

    // Dibujar overlay
    ctx.fillStyle = hexToRgba(config.overlayColor, config.overlayOpacity);
    ctx.fillRect(0, 0, 600, 420);

    // Configurar texto
    ctx.textBaseline = 'top';

    // Calcular área de texto combinada
    const titleMetrics = measureText(ctx, config.title, config.titleSize, config.titleFont, config.titleWeight);
    const subtitleMetrics = measureText(ctx, config.subtitle, config.subtitleSize, config.subtitleFont, config.subtitleWeight);
    
    // Calcular posición del contenedor de texto
    const containerY = (config.titlePosition.y / 100) * 420;
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
        600, // Ancho completo
        containerHeight
      );
      ctx.globalAlpha = 1;
    }

    // Calcular posición X según alineación del título (subtítulo usa la misma)
    let titleX = containerPadding;
    let subtitleX = containerPadding;
    
    // Dibujar título
    ctx.fillStyle = config.titleColor;
    ctx.font = `${config.titleWeight} ${config.titleSize}px ${config.titleFont}`;
    
    if (config.titlePosition.align === 'center') {
      ctx.textAlign = 'center';
      titleX = 600 / 2;
      subtitleX = 600 / 2;
    } else if (config.titlePosition.align === 'right') {
      ctx.textAlign = 'right';
      titleX = 600 - containerPadding;
      subtitleX = 600 - containerPadding;
    } else {
      ctx.textAlign = 'left';
      titleX = containerPadding;
      subtitleX = containerPadding;
    }
    
    ctx.fillText(config.title, titleX, containerY);

    // Dibujar subtítulo (misma alineación que el título)
    ctx.fillStyle = config.subtitleColor;
    ctx.font = `${config.subtitleWeight} ${config.subtitleSize}px ${config.subtitleFont}`;
    
    ctx.fillText(config.subtitle, subtitleX, containerY + config.titleSize + textSpacing);
  };

  const downloadImage = async () => {
    // Crear un canvas temporal para la descarga en tamaño completo
    const downloadCanvas = document.createElement('canvas');
    await drawFullSizeThumbnail(downloadCanvas);

    const link = document.createElement('a');
    link.download = `miniatura-${Date.now()}.png`;
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Preview con tamaños de Moodle */}
      <div className="bg-muted p-8 rounded-none">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Moodle Grid Style</h3>
          <div className="flex gap-0">
            <Button 
              onClick={() => setPreviewScale(1)} 
              variant={previewScale === 1 ? "default" : "outline"}
              size="icon-xs"
              className='rounded-tr-none rounded-br-none px-4'
            >
              <ZoomOut className='size-4' />
            </Button>
            <Button 
              onClick={() => setPreviewScale(2)} 
              variant={previewScale === 2 ? "default" : "outline"}
              size="icon-xs"
              className='rounded-tl-none rounded-bl-none px-4'
            >
              <ZoomIn className='size-4' />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-center bg-white border border-gray-200 rounded p-4">
          {previewUrl ? (
            <div className='border rounded-md bg-muted shadow-sm overflow-hidden'>
              <p className='px-4 py-1.5 text-sm text-blue-600'>Presentación del curso</p>
            <img 
              src={previewUrl} 
              alt="Vista previa en tamaño Moodle"
              style={{
                width: 200 * previewScale,
                height: 140 * previewScale,
                objectFit: 'contain'
              }}
              className=""
            />
            </div>
          ) : (
            <div 
              className="border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400"
              style={{
                width: 200 * previewScale,
                height: 140 * previewScale
              }}
            >
              Sin configuración
            </div>
          )}
        </div>
      </div>
      
      {/* Canvas oculto para generar la imagen */}
      <div className="hidden">
        <canvas ref={canvasRef} />
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={downloadImage}
          variant="default"
          size="icon-xs"
        >
          <Download />
        </Button>
        <Button
          onClick={() => navigator.clipboard?.writeText(previewUrl)}
          variant="outline"
          size="icon-xs"
        >
          <Copy />
        </Button>
      </div>
    </div>
  );
}