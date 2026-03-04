import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from 'canvas';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const width = parseInt(searchParams.get('width') || '600');
  const height = parseInt(searchParams.get('height') || '420');
  const text = searchParams.get('text') || 'Sin imagen';

  // Crear canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fondo gris claro
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);

  // Borde
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Texto
  const fontSize = Math.min(width / 15, height / 8);
  ctx.fillStyle = '#6b7280';
  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  // Convertir a buffer
  const buffer = canvas.toBuffer('image/png');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}