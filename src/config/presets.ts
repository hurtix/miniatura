import { ThumbnailPreset } from '@/types/thumbnail';

export const DEFAULT_PRESETS: ThumbnailPreset[] = [
  {
    id: 'basica',
    name: 'Básica',
    description: 'Diseño profesional con fondo azul y texto blanco centrado',
    config: {
      title: 'Título del Curso',
      subtitle: 'Subtítulo descriptivo',
      
      backgroundImage: '/backgrounds/ia.jpg',
      backgroundOpacity: 0.3,
      overlayColor: '#1e40af', // Azul corporativo
      overlayOpacity: 0.7,
      
      titleColor: '#ffffff',
      titleSize: 48,
      titleFont: 'Open Sans',
      titleWeight: 700,
      
      subtitleColor: '#e5e7eb',
      subtitleSize: 24,
      subtitleFont: 'Open Sans', 
      subtitleWeight: 400,
      
      titlePosition: { x: 50, y: 40, align: 'center' },
      subtitlePosition: { x: 50, y: 60, align: 'center' },
      
      titleBackground: 'rgba(0, 0, 0, 0.3)',
      titleBackgroundOpacity: 0.7,
      subtitleBackground: 'rgba(0, 0, 0, 0.2)',
      subtitleBackgroundOpacity: 0.5,
      
      width: 800,
      height: 450,
    }
  },
  {
    id: 'especifica',
    name: 'Específica',
    description: 'Estilo educativo con colores verdes y layout estructurado',
    config: {
      title: 'Curso Académico',
      subtitle: 'Descripción del contenido',
      
      backgroundImage: '/backgrounds/ia.jpg',
      backgroundOpacity: 0.4,
      overlayColor: '#059669', // Verde académico
      overlayOpacity: 0.6,
      
      titleColor: '#ffffff',
      titleSize: 42,
      titleFont: 'Open Sans',
      titleWeight: 600,
      
      subtitleColor: '#d1fae5',
      subtitleSize: 20,
      subtitleFont: 'Open Sans',
      subtitleWeight: 400,
      
      titlePosition: { x: 10, y: 30, align: 'left' },
      subtitlePosition: { x: 10, y: 50, align: 'left' },
      
      titleBackground: 'rgba(0, 0, 0, 0.4)',
      titleBackgroundOpacity: 0.8,
      subtitleBackground: 'rgba(0, 0, 0, 0.3)',
      subtitleBackgroundOpacity: 0.6,
      
      width: 800,
      height: 450,
    }
  },
  {
    id: 'sociohumanistica',
    name: 'Sociohumanística',
    description: 'Diseño minimalista con gradiente y tipografía elegante',
    config: {
      title: 'Curso Innovador',
      subtitle: 'Aprendizaje del futuro',
      
      backgroundImage: '/backgrounds/ia.jpg',
      backgroundOpacity: 0.5,
      overlayColor: '#7c3aed', // Púrpura moderno
      overlayOpacity: 0.5,
      
      titleColor: '#ffffff',
      titleSize: 52,
      titleFont: 'Open Sans',
      titleWeight: 700,
      
      subtitleColor: '#c4b5fd',
      subtitleSize: 26,
      subtitleFont: 'Open Sans',
      subtitleWeight: 300,
      
      titlePosition: { x: 90, y: 35, align: 'right' },
      subtitlePosition: { x: 90, y: 55, align: 'right' },
      
      titleBackground: 'rgba(0, 0, 0, 0.25)',
      titleBackgroundOpacity: 0.6,
      subtitleBackground: 'rgba(0, 0, 0, 0.15)',
      subtitleBackgroundOpacity: 0.4,
      
      width: 800,
      height: 450,
    }
  }
];

// Configuración por defecto para nuevos presets
export const DEFAULT_CONFIG = {
  ...DEFAULT_PRESETS[0].config,
  backgroundImage: null,
  backgroundOpacity: 1.0
};