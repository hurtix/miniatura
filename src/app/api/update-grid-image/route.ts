import { NextRequest, NextResponse } from 'next/server';
import { uploadAndUpdateSectionImage } from '@/lib/moodle';
import { z } from 'zod';

// Esquema de validación para los parámetros
const updateImageSchema = z.object({
  courseId: z.number().int().positive('Course ID must be a positive integer'),
  sectionId: z.number().int().positive('Section ID must be a positive integer'),
});

// Tipos para las respuestas
interface SuccessResponse {
  success: true;
  data: {
    filename: string;
    contenthash: string;
    message: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

/**
 * POST /api/update-grid-image
 * 
 * Actualiza la imagen de una sección en Moodle Grid
 * 
 * Body: multipart/form-data
 * - courseId: number
 * - sectionId: number  
 * - image: File
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Verificar que la request tenga multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content-Type must be multipart/form-data'
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Parsear FormData
    const formData = await request.formData();
    
    // Extraer y validar parámetros
    const courseIdStr = formData.get('courseId') as string;
    const sectionIdStr = formData.get('sectionId') as string;
    const imageFile = formData.get('image') as File;

    if (!courseIdStr || !sectionIdStr || !imageFile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: courseId, sectionId, and image are required'
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validar tipos y convertir a números
    const courseId = parseInt(courseIdStr, 10);
    const sectionId = parseInt(sectionIdStr, 10);

    // Logging para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 DEBUG - Valores recibidos:');
      console.log('  courseIdStr:', courseIdStr, typeof courseIdStr);
      console.log('  sectionIdStr:', sectionIdStr, typeof sectionIdStr);
      console.log('  courseId converted:', courseId, typeof courseId);  
      console.log('  sectionId converted:', sectionId, typeof sectionId);
    }

    if (isNaN(courseId) || isNaN(sectionId) || courseId <= 0 || sectionId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `courseId and sectionId must be valid numbers. Received: courseId="${courseIdStr}" (${typeof courseIdStr}), sectionId="${sectionIdStr}" (${typeof sectionIdStr})`,
          details: `Converted values: courseId=${courseId}, sectionId=${sectionId}`
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validar con schema
    const validation = updateImageSchema.safeParse({ courseId, sectionId });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues.map(issue => issue.message).join(', ')
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validar archivo de imagen
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'File must be an image'
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Limitar tamaño de archivo (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'File size must be less than 5MB'
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Convertir archivo a Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Generar nombre de archivo único
    const timestamp = Date.now();
    const filename = `section_${sectionId}_${timestamp}.png`;

    // Llamar función de Moodle
    const result = await uploadAndUpdateSectionImage({
      courseId,
      sectionId,
      imageBuffer,
      filename
    });

    // Respuesta exitosa
    return NextResponse.json(
      {
        success: true,
        data: {
          filename: result.filename,
          contenthash: result.contenthash,
          message: `Image updated successfully for course ${courseId}, section ${sectionId}`
        }
      } as SuccessResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in update-grid-image API:', error);

    // Determinar tipo de error
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Errores específicos de Moodle
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        statusCode = 401;
        errorMessage = 'Authentication failed with Moodle';
      } else if (error.message.includes('permission') || error.message.includes('access')) {
        statusCode = 403;
        errorMessage = 'Access denied to Moodle resource';
      } else if (error.message.includes('not found') || error.message.includes('course') || error.message.includes('section')) {
        statusCode = 404;
        errorMessage = 'Course or section not found in Moodle';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      } as ErrorResponse,
      { status: statusCode }
    );
  }
}

// Exportar método OPTIONS para CORS si es necesario
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}