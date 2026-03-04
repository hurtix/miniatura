// Tipos para el generador de miniaturas de Moodle

export interface ThumbnailConfig {
  // Contenido
  title: string;
  subtitle: string;
  
  // Imagen de fondo
  backgroundImage: string | null; // URL de la imagen de fondo
  
  // Diseño 
  overlayColor: string;
  overlayOpacity: number;
  
  // Estilo del texto
  titleColor: string;
  titleSize: number;
  titleFont: 'Open Sans' | 'Arial' | 'Helvetica';
  titleWeight: 300 | 400 | 500 | 600 | 700;
  
  subtitleColor: string;
  subtitleSize: number;
  subtitleFont: 'Open Sans' | 'Arial' | 'Helvetica';
  subtitleWeight: 300 | 400 | 500 | 600 | 700;
  
  // Posicionamiento
  titlePosition: Position;
  
  // Fondo del texto 
  titleBackground: string;
  titleBackgroundOpacity: number;
  subtitleBackground: string;
  
  // Dimensiones
  width: number;
  height: number;
}

// Nueva estructura para conjunto completo de curso
export interface CourseSet {
  courseName: string;
  unitCount: number;
  preset: string;
  units: UnitConfig[];
  presentationThumbnail: ThumbnailConfig;
  evaluationThumbnail: ThumbnailConfig;
}

export interface UnitConfig {
  unitNumber: number;
  unitTitle: string; // "Unidad 1", "Unidad 2", etc. (no modificable)
  unitSubtitle: string; // Tema de la unidad (modificable)
  thumbnail: ThumbnailConfig;
}

export interface Position {
  y: number;
  align: 'left' | 'center' | 'right';
}

export interface ThumbnailPreset {
  id: string;
  name: string;
  description?: string; // Ahora opcional
  config: ThumbnailConfig;
  thumbnail?: string; // Preview image URL
}

export interface MoodleConfig {
  apiUrl: string;
  token: string;
  courseId?: number;
  activityId?: number;
}

// Formulario de datos para conjunto completo
export interface CourseForm {
  preset: string;
  presetConfig?: ThumbnailConfig; // Configuración completa del preset
  units?: {
    unitSubtitle: string;
  }[];
}

// Respuesta de la API
export interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface GenerateSetResponse {
  success: boolean;
  images: {
    type: 'presentation' | 'unit' | 'evaluation';
    unitNumber?: number;
    imageUrl: string;
    filename: string;
  }[];
  error?: string;
}

export interface MoodleUploadResponse {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}