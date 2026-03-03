import { 
  MoodleSection, 
  MoodleError, 
  MoodleCourseContentsResponse,
  GetCourseContentsParams,
  CourseSection,
  MoodleConfig,
  MoodleCourse
} from '@/types/moodle';

/**
 * Configuración de Moodle desde variables de entorno
 */
function getMoodleConfig(): MoodleConfig {
  const baseUrl = process.env.MOODLE_BASE_URL;
  const token = process.env.MOODLE_WS_TOKEN;

  if (!baseUrl || !token) {
    throw new Error('MOODLE_BASE_URL and MOODLE_WS_TOKEN must be set in environment variables');
  }

  return { baseUrl, token };
}

/**
 * Función genérica para hacer llamadas a la API REST de Moodle
 */
async function callMoodleAPI<T>(
  wsfunction: string, 
  params: Record<string, any> = {}
): Promise<T> {
  const config = getMoodleConfig();
  
  const url = `${config.baseUrl}/webservice/rest/server.php`;
  
  // Preparar parámetros para form-urlencoded
  const formParams = new URLSearchParams({
    wstoken: config.token,
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
      { courseid: courseid.toString() }
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
      { courseid: courseid.toString() }
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
      { courseid: courseid.toString() }
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

    const response = await callMoodleAPI<{ courses: MoodleCourse[], warnings?: any[] }>(
      'core_course_search_courses',
      { 
        criterianame: 'search',
        criteriavalue: searchTerm.trim(),
        page: 0,
        perpage: limit
      }
    );

    return response.courses || [];
  } catch (error) {
    console.error('Error searching courses:', error);
    
    // Fallback: intentar con get courses si search falla
    try {
      const allCourses = await callMoodleAPI<MoodleCourse[]>('core_course_get_courses', {});
      
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
    });
    
    return courses.length > 0 ? courses[0] : null;
  } catch (error) {
    console.error(`Error getting course details for ${courseid}:`, error);
    return null;
  }
}