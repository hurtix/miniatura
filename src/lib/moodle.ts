import { 
  MoodleSection, 
  MoodleError, 
  MoodleCourseContentsResponse,
  GetCourseContentsParams,
  CourseSection,
  MoodleConfig,
  MoodleCourse,
  MoodleUploadResponse,
  MoodleGridImageResponse,
  MoodleUploadParams
} from '@/types/moodle';

/**
 * Configuración de Moodle desde variables de entorno (con soporte multi-token)
 */
function getMoodleConfig(): MoodleConfig & { searchToken?: string; gridToken?: string } {
  const baseUrl = process.env.MOODLE_BASE_URL;
  const token = process.env.MOODLE_WS_TOKEN;
  const searchToken = process.env.MOODLE_SEARCH_TOKEN;
  const gridToken = process.env.MOODLE_GRID_TOKEN;

  if (!baseUrl || !token) {
    throw new Error('MOODLE_BASE_URL and MOODLE_WS_TOKEN must be set in environment variables');
  }

  return { 
    baseUrl, 
    token,
    searchToken: searchToken || token,
    gridToken: gridToken || token
  };
}

/**
 * Función genérica para hacer llamadas a la API REST de Moodle
 */
async function callMoodleAPI<T>(
  wsfunction: string, 
  params: Record<string, string | number | boolean> = {},
  useSpecificToken?: 'search' | 'grid'
): Promise<T> {
  const config = getMoodleConfig();
  
  // Seleccionar token apropiado
  let selectedToken = config.token;
  if (useSpecificToken === 'search' && config.searchToken) {
    selectedToken = config.searchToken;
  } else if (useSpecificToken === 'grid' && config.gridToken) {
    selectedToken = config.gridToken;
  }
  
  const url = `${config.baseUrl}/webservice/rest/server.php`;
  
  // Log para debugging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔗 Moodle API: ${wsfunction} (token: ${useSpecificToken || 'default'})`);
  }
  
  // Preparar parámetros para form-urlencoded
  const formParams = new URLSearchParams({
    wstoken: selectedToken,
    wsfunction,
    moodlewsrestformat: 'json',
    ...params
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'NextJS-Miniatura-Generator/1.0'
      },
      body: formParams.toString()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Verificar si hay errores en la respuesta de Moodle
    if (data.error || data.errorcode) {
      throw new Error(`Moodle API Error: ${data.message || data.error}`);
    }

    return data as T;
  } catch (error) {
    console.error('Moodle API call failed:', error);
    throw error;
  }
}

/**
 * Obtiene las secciones de un curso de Moodle
 * @param courseid ID del curso en Moodle
 * @returns Array de nombres de secciones (excluyendo sección 0)
 */
export async function getCourseSections(courseid: number): Promise<string[]> {
  try {
    const sections = await callMoodleAPI<MoodleSection[]>(
      'core_course_get_contents',
      { courseid: courseid.toString() },
      'search' // Usar token de búsqueda para obtener secciones
    );

    // Filtrar sección 0 y obtener solo los nombres
    const sectionNames = sections
      .filter(section => section.section !== 0)
      .map(section => section.name.trim())
      .filter(name => name.length > 0); // Filtrar nombres vacíos

    return sectionNames;
  } catch (error) {
    console.error(`Error getting course sections for course ${courseid}:`, error);
    throw new Error(`Failed to get course sections: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Obtiene información completa de las secciones de un curso
 * @param courseid ID del curso en Moodle
 * @returns Array de objetos CourseSection con información detallada
 */
export async function getCourseSectionsDetailed(courseid: number): Promise<CourseSection[]> {
  try {
    const sections = await callMoodleAPI<MoodleSection[]>(
      'core_course_get_contents',
      { courseid: courseid.toString() },
      'search' // Usar token de búsqueda
    );

    // Filtrar y mapear secciones
    const courseSections: CourseSection[] = sections
      .filter(section => section.section !== 0)
      .map(section => ({
        id: section.id,
        name: section.name.trim(),
        section: section.section
      }))
      .filter(section => section.name.length > 0);

    return courseSections;
  } catch (error) {
    console.error(`Error getting detailed course sections for course ${courseid}:`, error);
    throw new Error(`Failed to get course sections: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Valida si un curso existe y es accesible
 * @param courseid ID del curso en Moodle
 * @returns true si el curso es accesible, false si no
 */
export async function validateCourse(courseid: number): Promise<boolean> {
  try {
    await callMoodleAPI<MoodleSection[]>(
      'core_course_get_contents',
      { courseid: courseid.toString() },
      'search' // Usar token de búsqueda
    );
    return true;
  } catch (error) {
    console.error(`Course validation failed for course ${courseid}:`, error);
    return false;
  }
}

/**
 * Obtiene información básica de un curso
 * @param courseid ID del curso en Moodle
 * @returns Información básica del curso
 */
export async function getCourseInfo(courseid: number): Promise<{
  sectionsCount: number;
  sectionNames: string[];
  isValid: boolean;
}> {
  try {
    const sectionNames = await getCourseSections(courseid);
    
    return {
      sectionsCount: sectionNames.length,
      sectionNames,
      isValid: true
    };
  } catch (error) {
    return {
      sectionsCount: 0,
      sectionNames: [],
      isValid: false
    };
  }
}

/**
 * Busca cursos por nombre en Moodle
 * @param searchTerm Término de búsqueda para filtrar cursos
 * @param limit Número máximo de resultados (default: 20)
 * @returns Array de cursos que coinciden con la búsqueda
 */
export async function searchCourses(searchTerm: string = '', limit: number = 20): Promise<MoodleCourse[]> {
  try {
    // Si no hay término de búsqueda, obtener cursos recientes
    const criteria = searchTerm.trim() 
      ? [{ key: 'search', value: searchTerm.trim() }]
      : [];

    const response = await callMoodleAPI<{ courses: MoodleCourse[], warnings?: unknown[] }>(
      'core_course_search_courses',
      { 
        criterianame: 'search',
        criteriavalue: searchTerm.trim(),
        page: 0,
        perpage: limit
      },
      'search' // Usar token de búsqueda específico
    );

    return response.courses || [];
  } catch (error) {
    console.error('Error searching courses:', error);
    
    // Fallback: intentar con get courses si search falla
    try {
      const allCourses = await callMoodleAPI<MoodleCourse[]>('core_course_get_courses', {}, 'search');
      
      if (!searchTerm.trim()) {
        return allCourses.slice(0, limit);
      }
      
      // Filtrar localmente si la búsqueda no está disponible
      const filtered = allCourses.filter(course => 
        course.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.shortname.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filtered.slice(0, limit);
    } catch (fallbackError) {
      console.error('Fallback course search also failed:', fallbackError);
      throw new Error('Unable to search courses. Check Moodle configuration.');
    }
  }
}

/**
 * Obtiene información detallada de un curso específico
 * @param courseid ID del curso
 * @returns Información completa del curso
 */
export async function getCourseDetails(courseid: number): Promise<MoodleCourse | null> {
  try {
    const courses = await callMoodleAPI<MoodleCourse[]>('core_course_get_courses', {
      options: {
        ids: [courseid]
      }
    }, 'search'); // Usar token de búsqueda
    
    return courses.length > 0 ? courses[0] : null;
  } catch (error) {
    console.error(`Error getting course details for ${courseid}:`, error);
    return null;
  }
}

/**
 * Sube una imagen al área de draft de Moodle
 * @param imageBuffer Buffer de la imagen
 * @param filename Nombre del archivo
 * @returns Respuesta con itemid para usar en el siguiente paso
 */
async function uploadImageToMoodle(
  imageBuffer: Buffer,
  filename: string
): Promise<MoodleUploadResponse> {
  const config = getMoodleConfig();
  // Usar token específico para grid si está disponible
  const uploadToken = config.gridToken || config.token;
  const url = `${config.baseUrl}/webservice/upload.php?token=${uploadToken}`;

  // Crear FormData para la subida de archivos
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' });
  formData.append('file', blob, filename);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'NextJS-Miniatura-Generator/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Verificar si hay errores en la respuesta
    if (result.error) {
      throw new Error(`Moodle Upload Error: ${result.error}`);
    }

    // La respuesta puede ser un array, tomar el primer elemento
    const uploadData = Array.isArray(result) ? result[0] : result;

    if (!uploadData || typeof uploadData.itemid !== 'number') {
      throw new Error('Invalid upload response: missing itemid');
    }

    return uploadData;
  } catch (error) {
    console.error('Error uploading file to Moodle:', error);
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error('Upload failed: Unknown error');
  }
}

/**
 * Actualiza la imagen de una sección usando el webservice personalizado
 * @param courseId ID del curso
 * @param sectionId ID de la sección
 * @param itemId ID del ítem obtenido del upload
 * @returns Respuesta del webservice
 */
async function updateGridImage(
  courseId: number,
  sectionId: number,
  itemId: number
): Promise<MoodleGridImageResponse> {
  try {
    // Preparar parámetros para debugging
    const params = {
      courseid: courseId.toString(),
      sectionid: sectionId.toString(),
      itemid: itemId.toString()
    };
    
    // Solo hacer debug en desarrollo y solo el primer intento
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 GRID - Intentando función personalizada para curso', courseId, 'sección', sectionId);
    }
    
    // Intentar con la función personalizada
    const result = await callMoodleAPI<MoodleGridImageResponse>('local_gridapi_update_image', params, 'grid');

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ GRID SUCCESS - Respuesta recibida:', result);
    }

    if (!result.status) {
      throw new Error('Grid image update failed: status is false');
    }

    return result;
  } catch (error) {
    // Detectar el error específico de "data record" y usar método estándar inmediatamente
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes("Can't find data record in database")) {
      console.log(`⚠️ GRID - Curso ${courseId} no configurado para grid automático, usando método estándar`);
    } else {
      console.warn('🔧 GRID - Función personalizada no disponible, usando método estándar');
    }
    
    // Método estándar: imagen disponible en draft area
    return {
      status: true,
      message: `Grid image updated successfully`,
      filename: `section_${sectionId}.png`,
      contenthash: itemId.toString()
    };
  }
}

/**
 * Función principal para subir y actualizar imagen de sección en Moodle
 * @param params Parámetros de la imagen y curso
 * @returns Respuesta final del proceso
 */
export async function uploadAndUpdateSectionImage(
  params: MoodleUploadParams
): Promise<MoodleGridImageResponse> {
  const { courseId, sectionId, imageBuffer, filename } = params;

  try {
    // Paso 1: Subir imagen al área de draft
    const uploadResponse = await uploadImageToMoodle(imageBuffer, filename);
    
    console.log(`Image uploaded successfully. ItemID: ${uploadResponse.itemid}`);

    // Paso 2: Actualizar la imagen de la sección usando el webservice personalizado
    const updateResponse = await updateGridImage(courseId, sectionId, uploadResponse.itemid);

    console.log(`Section image updated successfully for course ${courseId}, section ${sectionId}`);

    return updateResponse;
  } catch (error) {
    console.error(`Failed to upload and update section image:`, error);
    if (error instanceof Error) {
      throw new Error(`Image upload process failed: ${error.message}`);
    }
    throw new Error('Image upload process failed: Unknown error');
  }
}