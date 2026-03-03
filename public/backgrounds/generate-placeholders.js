// Script para generar imágenes de placeholder
// Ejecutar en la consola del navegador en http://localhost:3000

function createPlaceholderImage(name, colors, text) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');
  
  // Crear gradiente
  const gradient = ctx.createLinearGradient(0, 0, 800, 450);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  
  // Llenar fondo
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 450);
  
  // Añadir patrón sutil
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  for (let i = 0; i < 800; i += 100) {
    for (let j = 0; j < 450; j += 100) {
      ctx.fillRect(i, j, 50, 50);
    }
  }
  
  // Añadir texto
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = 'bold 48px Open Sans';
  ctx.textAlign = 'center';
  ctx.fillText(text, 400, 225);
  
  // Descargar
  const link = document.createElement('a');
  link.download = name;
  link.href = canvas.toDataURL();
  link.click();
}

// Generar todas las imágenes placeholder
createPlaceholderImage('corporate-bg.jpg', ['#1e40af', '#3b82f6'], 'CORPORATE');
createPlaceholderImage('academic-bg.jpg', ['#059669', '#10b981'], 'ACADEMIC'); 
createPlaceholderImage('modern-bg.jpg', ['#7c3aed', '#a855f7'], 'MODERN');
createPlaceholderImage('tech-bg.jpg', ['#0891b2', '#06b6d4'], 'TECH');
createPlaceholderImage('nature-bg.jpg', ['#16a34a', '#22c55e'], 'NATURE');
createPlaceholderImage('abstract-bg.jpg', ['#dc2626', '#f97316'], 'ABSTRACT');

console.log('✅ Todas las imágenes placeholder generadas y descargadas');