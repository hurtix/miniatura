// Tipos para la API de Moodle

export interface MoodleSection {
  id: number;
  name: string;
  visible: number;
  summary: string;
  summaryformat: number;
  section: number;
  hiddenbynumsections: number;
  uservisible: boolean;
  modules: MoodleModule[];
}

export interface MoodleCourse {
  id: number;
  fullname: string;
  shortname: string;
  categoryid: number;
  categoryname?: string;
  summary?: string;
  summaryformat?: number;
  format?: string;
  startdate?: number;
  enddate?: number;
  visible?: number;
  enrollmentmethods?: string[];
}

export interface MoodleModule {
  id: number;
  url: string;
  name: string;
  instance: number;
  description: string;
  visible: number;
  uservisible: boolean;
  visibleoncoursepage: number;
  modicon: string;
  modname: string;
  modplural: string;
  availability: string | null;
  indent: number;
  onclick: string;
  afterlink: string | null;
  customdata: string;
  noviewlink: boolean;
  completion: number;
}

export interface MoodleError {
  error: string;
  errorcode: string;
  message: string;
}

export interface MoodleCourseContentsResponse {
  sections?: MoodleSection[];
  error?: string;
  errorcode?: string;
  message?: string;
}

export interface MoodleConfig {
  baseUrl: string;
  token: string;
}

// Parámetros para las funciones de Moodle
export interface GetCourseContentsParams {
  courseid: number;
  options?: {
    excludemodules?: boolean;
    excludecontents?: boolean;
    includestealthmodules?: boolean;
    sectionid?: number;
    sectionnumber?: number;
    cmid?: number;
    modname?: string;
    modid?: number;
  };
}

// Respuesta simplificada para el frontend
export interface CourseSection {
  id: number;
  name: string;
  section: number;
}

// Tipos para la funcionalidad de upload de imágenes
export interface MoodleUploadResponse {
  itemid: number;
  contextid?: number;
  component?: string;
  filearea?: string;
  filename?: string;
  filepath?: string;
  filesize?: number;
  mimetype?: string;
  timemodified?: number;
}

export interface MoodleGridImageResponse {
  status: boolean;
  filename: string;
  contenthash: string;
  message?: string; // Campo opcional para mensajes informativos
}

export interface MoodleUploadParams {
  courseId: number;
  sectionId: number;
  imageBuffer: Buffer;
  filename: string;
}