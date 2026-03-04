# Sistema de Integración Completa con Moodle

## Resumen

Este sistema permite generar miniaturas para cursos de Moodle y subirlas automáticamente a las secciones correspondientes del curso. La integración incluye:

1. **Búsqueda inteligente de cursos** - Encuentra cursos por nombre en lugar de usar IDs manuales
2. **Carga automática de secciones** - Obtiene las secciones del curso seleccionado desde Moodle
3. **Selección de secciones** - Permite elegir qué secciones usar para las miniaturas
4. **Generación de miniaturas** - Crea imágenes personalizadas para cada sección
5. **Subida automática a Moodle** - Envía las imágenes generadas directamente a Moodle

## Flujo de Trabajo Completo

### 1. Configuración de Moodle

Asegurate de tener configuradas las variables de entorno:

```env
MOODLE_BASE_URL=https://tu-moodle.ejemplo.com
MOODLE_WS_TOKEN=tu_token_de_webservice
```

### 2. Búsqueda y Selección de Curso

1. En el formulario, comienza a escribir el nombre del curso
2. Se mostrará una lista de cursos que coincidan
3. Selecciona el curso deseado
4. Automáticamente se cargarán las secciones del curso

### 3. Selección de Secciones

1. Se mostrarán todas las secciones disponibles del curso
2. Usa los checkboxes para seleccionar las secciones deseadas
3. Los subtítulos de las unidades se llenarán automáticamente con los nombres de las secciones

### 4. Generación de Miniaturas

1. Configura los parámetros de diseño (colores, fuentes, etc.)
2. Haz clic en "Generar Miniaturas"
3. Se crearán las imágenes para:
   - Presentación del curso
   - Una imagen por cada sección seleccionada
   - Módulo de evaluación

### 5. Subida Automática a Moodle

1. Una vez generadas las miniaturas, aparecerá el botón "📤 Subir a Moodle"
2. Haz clic para iniciar la subida automática
3. Se mostrará el progreso de la subida en tiempo real
4. Al finalizar, verás un resumen de las subidas exitosas y fallidas

## APIs Disponibles

### `/api/moodle/search-courses`
Busca cursos por texto en nombre completo o nombre corto.

**Parámetros:**
- `query`: Texto a buscar (mínimo 3 caracteres)

**Respuesta:**
```json
{
  "success": true,
  "courses": [
    {
      "id": 123,
      "fullname": "Curso de Ejemplo",
      "shortname": "EJEMPLO",
      "categoryname": "Categoría",
      "label": "Curso de Ejemplo (EJEMPLO) - Categoría",
      "value": "123"
    }
  ]
}
```

### `/api/moodle/course-sections`
Obtiene las secciones de un curso específico.

**Parámetros:**
- `courseId`: ID del curso

**Respuesta:**
```json
{
  "success": true,
  "courseid": 123,
  "sections": ["Introducción", "Unidad 1", "Unidad 2", "Evaluación"],
  "count": 4
}
```

### `/api/update-grid-image`
Sube una imagen a una sección específica de un curso en Moodle.

**Parámetros (FormData):**
- `courseId`: ID del curso
- `sectionId`: ID de la sección
- `image`: Archivo de imagen (Blob/File)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "filename": "imagen.png",
    "contenthash": "abc123...",
    "message": "Imagen de grid actualizada exitosamente"
  }
}
```

## Componentes Principales

### CourseSetForm
El componente principal que maneja todo el flujo de trabajo:
- Búsqueda de cursos
- Selección de secciones
- Generación de miniaturas  
- Subida a Moodle

### CourseCombobox
Componente de búsqueda inteligente de cursos con autocompletado.

### Color Picker
Selector de colores profesional con presets y entrada hexadecimal.

## Librerías de Moodle

### `/lib/moodle.ts`
Cliente completo para la API de Moodle que incluye:

- `searchCourses()` - Busca cursos por texto
- `getCourseSections()` - Obtiene secciones de un curso
- `uploadImageToMoodle()` - Sube imagen al área de borradores
- `uploadAndUpdateSectionImage()` - Proceso completo de subida y actualización

### `/types/moodle.ts`
Definiciones de TypeScript para todas las estructuras de datos de Moodle.

## Ejemplo de Uso Programático

```typescript
import { uploadImageToMoodleGrid } from '@/examples/moodle-grid-upload';

// Subir una imagen individual
const result = await uploadImageToMoodleGrid(
  courseId,
  sectionId, 
  imageBlob,
  'miniatura.png'
);

if (result.success) {
  console.log('✅ Imagen subida:', result.filename);
} else {
  console.error('❌ Error:', result.error);
}
```

## Resolución de Problemas

### Error de Token
Si obtienes errores de autenticación:
1. Verifica que `MOODLE_WS_TOKEN` esté configurado correctamente
2. Asegurate de que el token tenga los permisos necesarios:
   - `webservice/rest:use`
   - `moodle/course:view`
   - `moodle/course:manageactivities`

### Error de CORS
Si hay problemas de CORS:
1. Verifica que `MOODLE_BASE_URL` sea correcto
2. Asegurate de que Moodle permita conexiones desde tu dominio

### Imágenes No Se Suben
Si las imágenes no se procesan:
1. Verifica el tamaño de la imagen (límite: 10MB por defecto)
2. Confirma que el formato sea PNG/JPEG
3. Revisa los logs del servidor para detalles específicos

## Próximas Mejoras

- [ ] Soporte para múltiples formatos de imagen
- [ ] Cache de búsquedas de cursos
- [ ] Reintento automático en caso de fallos
- [ ] Previsualización de cómo se verán las imágenes en Moodle
- [ ] Backup automático de imágenes anteriores