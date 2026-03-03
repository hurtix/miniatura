import { NextRequest, NextResponse } from 'next/server';
import { searchCourses } from '@/lib/moodle';
import { z } from 'zod';

// Schema de validación para búsqueda
const SearchParamsSchema = z.object({
  q: z.string().optional().default(''),
  limit: z.string().optional().transform(val => parseInt(val || '20', 10)).pipe(z.number().min(1).max(50)).optional().default(20)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validar parámetros de búsqueda
    const parseResult = SearchParamsSchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit')
    });
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid search parameters',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const { q, limit } = parseResult.data;

    // Buscar cursos
    const courses = await searchCourses(q, limit);
    
    // Mapear a formato simplificado para el frontend
    const simplifiedCourses = courses.map(course => ({
      id: course.id,
      fullname: course.fullname,
      shortname: course.shortname,
      categoryname: course.categoryname || 'Sin categoría',
      // Crear un label combinado para mejor búsqueda
      label: `${course.fullname}${course.shortname !== course.fullname ? ` (${course.shortname})` : ''}`,
      value: course.id.toString()
    }));

    return NextResponse.json({
      success: true,
      courses: simplifiedCourses,
      count: simplifiedCourses.length,
      searchTerm: q
    });

  } catch (error) {
    console.error('Error in courses search API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search courses',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}