import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { ThumbnailConfig } from '@/types/thumbnail';
import path from 'path';
import fs from 'fs';

// Registrar fuentes Open Sans
try {
  const ttfDir = path.join(process.cwd(), 'public/fonts')
  const regularTtf = path.join(ttfDir, 'OpenSans-Regular.ttf')
  const boldTtf = path.join(ttfDir, 'OpenSans-Bold.ttf')
  
  if (fs.existsSync(regularTtf) && fs.existsSync(boldTtf)) {
    registerFont(regularTtf, { family: 'Open Sans', weight: 'normal' })
    registerFont(regularTtf, { family: 'Open Sans', weight: '400' })
    registerFont(boldTtf, { family: 'Open Sans', weight: 'bold' })
    registerFont(boldTtf, { family: 'Open Sans', weight: '700' })
  }
} catch (error) {
  console.warn('Open Sans font registration failed, using system fonts as fallback')
}

// Función para mapear fuentes a equivalentes del sistema
function getFontFamily(configFont: string): string {

  return configFont;
}

// Función para mapear pesos numéricos a CSS font-weight
function mapFontWeight(weight: number): string {
  if (weight <= 300) return '300';
  if (weight <= 400) return '400';
  if (weight <= 500) return '500';
  if (weight <= 600) return '600';
  if (weight >= 700) return 'bold';
  return '400'; // default
}

export async function POST(request: NextRequest) {
  try {
    const config: ThumbnailConfig = await request.json();


    // Crear canvas
    const canvas = createCanvas(config.width, config.height);
    const ctx = canvas.getContext('2d');

    // Dibujar imagen de fondo si existe
    if (config.backgroundImage) {
      try {
        // Construir ruta absoluta a la imagen
        const imagePath = path.join(process.cwd(), 'public', config.backgroundImage);
        const backgroundImg = await loadImage(imagePath);
        
        // Dibujar imagen de fondo ajustada al tamaño del canvas
        ctx.globalAlpha = config.backgroundOpacity || 1;
        ctx.drawImage(backgroundImg, 0, 0, config.width, config.height);
        ctx.globalAlpha = 1;
      } catch (error) {
        console.warn('No se pudo cargar la imagen de fondo:', config.backgroundImage, error);
        // Fallback: fondo gris
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, config.width, config.height);
      }
    } else {
      // Fondo por defecto
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, config.width, config.height);
    }

    // Overlay
    const overlayColor = hexToRgb(config.overlayColor);
    ctx.fillStyle = `rgba(${overlayColor.r}, ${overlayColor.g}, ${overlayColor.b}, ${config.overlayOpacity})`;
    ctx.fillRect(0, 0, config.width, config.height);

    // Configurar texto
    ctx.textBaseline = 'top';

    // Calcular área de texto combinada
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

    // Calcular posición X según alineación del título
    let titleX = containerPadding;
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

    // Dibujar título
    ctx.fillStyle = config.titleColor;
    const titleFontString = `${mapFontWeight(config.titleWeight)} ${config.titleSize}px "${getFontFamily(config.titleFont)}"`;
    ctx.font = titleFontString;
    ctx.fillText(config.title, titleX, containerY);

    // Calcular posición X según alineación del subtítulo
    let subtitleX = containerPadding;
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

    // Dibujar subtítulo
    ctx.fillStyle = config.subtitleColor;
    const subtitleFontString = `${mapFontWeight(config.subtitleWeight)} ${config.subtitleSize}px "${getFontFamily(config.subtitleFont)}"`;
    ctx.font = subtitleFontString;
    ctx.fillText(config.subtitle, subtitleX, containerY + config.titleSize + textSpacing);

    // Convertir canvas a buffer
    const buffer = canvas.toBuffer('image/png');

    // Procesar con Sharp para optimización
    const optimizedBuffer = await sharp(buffer)
      .png({ 
        quality: 90,
        compressionLevel: 6,
        progressive: true 
      })
      .toBuffer();

    // Retornar imagen como Uint8Array
    return new Response(new Uint8Array(optimizedBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="miniatura-${Date.now()}.png"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Error al generar la imagen' },
      { status: 500 }
    );
  }
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}