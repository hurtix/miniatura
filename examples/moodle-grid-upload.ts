/**
 * Ejemplo de uso del API de actualización de imágenes de grid en Moodle
 * 
 * Este archivo muestra cómo usar el nuevo endpoint /api/update-grid-image
 * desde el frontend para subir imágenes generadas a Moodle.
 */

// Función utilitaria para subir imagen a Moodle
export async function uploadImageToMoodleGrid(
  courseId: number,
  sectionId: number,
  imageBlob: Blob,
  filename: string = `section_${sectionId}.png`
): Promise<{
  success: boolean;
  filename?: string;
  contenthash?: string;
  message?: string;
  error?: string;
}> {
  try {
    // Crear FormData con los parámetros requeridos
    const formData = new FormData();
    formData.append('courseId', courseId.toString());
    formData.append('sectionId', sectionId.toString());
    formData.append('image', imageBlob, filename);

    // Hacer la petición al API
    const response = await fetch('/api/update-grid-image', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP Error: ${response.status}`);
    }

    return {
      success: result.success,
      filename: result.data?.filename,
      contenthash: result.data?.contenthash,
      message: result.data?.message,
    };
  } catch (error) {
    console.error('Error uploading image to Moodle:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Ejemplo de uso desde un componente React
export function ExampleUsage() {
  const handleUploadToMoodle = async (
    generatedImageUrl: string,
    courseId: number,
    sectionId: number
  ) => {
    try {
      // 1. Convertir imagen generada a Blob
      const response = await fetch(generatedImageUrl);
      const imageBlob = await response.blob();

      // 2. Subir a Moodle
      const result = await uploadImageToMoodleGrid(
        courseId, 
        sectionId, 
        imageBlob,
        `miniatura_seccion_${sectionId}.png`
      );

      if (result.success) {
        console.log('✅ Imagen subida exitosamente:', result);
        alert(`Imagen actualizada en Moodle: ${result.message}`);
      } else {
        console.error('❌ Error al subir:', result.error);
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error en el proceso:', error);
      alert('Error al procesar la imagen');
    }
  };

  // Ejemplo de uso con múltiples imágenes
  const handleUploadMultipleImages = async (
    generatedImages: Array<{
      url: string;
      courseId: number;
      sectionId: number;
      unitNumber?: number;
    }>
  ) => {
    const results = [];

    for (const image of generatedImages) {
      try {
        const response = await fetch(image.url);
        const imageBlob = await response.blob();

        const filename = image.unitNumber 
          ? `unidad_${image.unitNumber}_curso_${image.courseId}.png`
          : `seccion_${image.sectionId}_curso_${image.courseId}.png`;

        const result = await uploadImageToMoodleGrid(
          image.courseId,
          image.sectionId,
          imageBlob,
          filename
        );

        results.push({
          sectionId: image.sectionId,
          success: result.success,
          error: result.error,
          filename: result.filename,
        });

        // Pequeña pausa entre uploads para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.push({
          sectionId: image.sectionId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  };

  // Función para integrar con el generador de conjunto de miniaturas
  const handleGenerateAndUploadCourseSet = async (courseData: {
    courseId: number;
    courseName: string;
    selectedSections: Array<{ id: string; name: string; selected: boolean }>;
  }) => {
    try {
      // 1. Generar el conjunto de miniaturas (usando el API existente)
      const generateResponse = await fetch('/api/generate-course-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: courseData.courseName,
          // ... otros parámetros del conjunto
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Error al generar las miniaturas');
      }

      const generatedSet = await generateResponse.json();

      // 2. Subir cada imagen a su respectiva sección en Moodle
      const uploadPromises = generatedSet.images
        .filter((img: any) => img.type === 'unit') // Solo las unidades
        .map(async (img: any, index: number) => {
          // Mapear el índice de la imagen con la sección correspondiente
          const selectedSection = courseData.selectedSections
            .filter(s => s.selected)[index];

          if (!selectedSection) return null;

          const response = await fetch(img.url);
          const imageBlob = await response.blob();

          return uploadImageToMoodleGrid(
            courseData.courseId,
            parseInt(selectedSection.id), // convertir sectionId de string a number
            imageBlob,
            `unidad_${index + 1}_${selectedSection.name.replace(/\s+/g, '_')}.png`
          );
        });

      const uploadResults = await Promise.allSettled(uploadPromises);
      
      // Procesar resultados
      const successful = uploadResults
        .filter(result => result.status === 'fulfilled' && result.value?.success)
        .length;

      const failed = uploadResults.length - successful;

      console.log(`✅ Subida completada: ${successful} exitosas, ${failed} fallidas`);
      
      return {
        total: uploadResults.length,
        successful,
        failed,
        results: uploadResults,
      };
    } catch (error) {
      console.error('Error en el proceso completo:', error);
      throw error;
    }
  };

  return {
    uploadImageToMoodleGrid,
    handleUploadToMoodle,
    handleUploadMultipleImages,
    handleGenerateAndUploadCourseSet,
  };
}

// Tipos para uso en componentes
export interface MoodleUploadResult {
  success: boolean;
  filename?: string;
  contenthash?: string;
  message?: string;
  error?: string;
}

export interface BatchUploadResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    sectionId: number;
    success: boolean;
    error?: string;
    filename?: string;
  }>;
}