import { NextRequest, NextResponse } from 'next/server';
import { getCourseSections, getCourseInfo, getCourseSectionsDetailed } from '@/lib/moodle';
import { z } from 'zod';

// Schema de validación para los parámetros
const CourseParamsSchema = z.object({
  courseid: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1))
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseidParam = searchParams.get('courseid');

    if (!courseidParam) {
      return NextResponse.json(
        { error: 'Missing courseid parameter' },
        { status: 400 }
      );
    }

    // Validar parámetros
    const parseResult = CourseParamsSchema.safeParse({ courseid: courseidParam });
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid courseid parameter',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const { courseid } = parseResult.data;

    // Obtener información del curso con IDs reales de secciones
    const sectionsDetailed = await getCourseSectionsDetailed(courseid);
    
    if (sectionsDetailed.length === 0) {
      return NextResponse.json(
        { 
          error: 'No sections found in this course',
          courseid 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      courseid,
      sectionsCount: sectionsDetailed.length,
      sections: sectionsDetailed.map(section => ({
        id: section.id,
        name: section.name,
        section: section.section
      }))
    });

  } catch (error) {
    console.error('Error in course sections API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar parámetros del body
    const parseResult = CourseParamsSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request body',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const { courseid } = parseResult.data;

    // Obtener solo los nombres de las secciones
    const sections = await getCourseSections(courseid);

    return NextResponse.json({
      success: true,
      courseid,
      sections,
      count: sections.length
    });

  } catch (error) {
    console.error('Error in course sections POST API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get course sections',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}