import { NextRequest, NextResponse } from 'next/server'
import { createCanvas, loadImage as nodeLoadImage, registerFont } from 'canvas'
import path from 'path'
import fs from 'fs'
import type { ThumbnailConfig, CourseForm, GenerateSetResponse } from '@/types/thumbnail'
import { DEFAULT_PRESETS } from '@/config/presets'

// Registrar fuentes Open Sans
try {
  // Intentar primero con archivos TTF convertidos (más compatibles con Canvas)
  const ttfDir = path.join(process.cwd(), 'public/fonts')
  const regularTtf = path.join(ttfDir, 'OpenSans-Regular.ttf')
  const boldTtf = path.join(ttfDir, 'OpenSans-Bold.ttf')
  
  if (fs.existsSync(regularTtf) && fs.existsSync(boldTtf)) {
    registerFont(regularTtf, { family: 'Open Sans', weight: 'normal' })
    registerFont(regularTtf, { family: 'Open Sans', weight: '400' })
    registerFont(boldTtf, { family: 'Open Sans', weight: 'bold' })
    registerFont(boldTtf, { family: 'Open Sans', weight: '700' })
  }
} catch (error) {
  console.warn('Open Sans font registration failed, using system fonts as fallback')
}

// Función para mapear fuentes a equivalentes del sistema
function getFontFamily(configFont: string): string {
  return configFont;
}

// Función para mapear pesos numéricos a CSS font-weight
function mapFontWeight(weight: number): string {
  if (weight <= 300) return '300';
  if (weight <= 400) return '400';
  if (weight <= 500) return '500';
  if (weight <= 600) return '600';
  if (weight >= 700) return 'bold';
  return '400';
}

// Función de dibujado de thumbnails
async function drawThumbnail(canvas: any, ctx: any, config: ThumbnailConfig) {
  const { width, height } = config
  
  // Limpiar canvas
  ctx.clearRect(0, 0, width, height)
  
  // Dibujar imagen de fondo si existe
  if (config.backgroundImage) {
    try {
      // Construir ruta absoluta a la imagen
      const imagePath = path.join(process.cwd(), 'public', config.backgroundImage.replace(/^\//, ''))
      
      if (fs.existsSync(imagePath)) {
        const backgroundImg = await nodeLoadImage(imagePath)
        
        // Dibujar imagen de fondo ajustada al tamaño del canvas
        ctx.globalAlpha = config.backgroundOpacity || 1
        ctx.drawImage(backgroundImg, 0, 0, width, height)
        ctx.globalAlpha = 1
      }
    } catch (error) {
      console.warn('No se pudo cargar la imagen de fondo:', config.backgroundImage, error)
      // Fallback: fondo gris
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, width, height)
    }
  } else {
    // Fondo por defecto
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, width, height)
  }

  // Overlay de color - usar la misma lógica que el individual
  const overlayColor = hexToRgb(config.overlayColor)
  ctx.fillStyle = `rgba(${overlayColor.r}, ${overlayColor.g}, ${overlayColor.b}, ${config.overlayOpacity})`
  ctx.fillRect(0, 0, width, height)

  // Configurar texto
  ctx.textBaseline = 'top'

  // Calcular área de texto combinada - usar la misma lógica que el individual
  const containerY = (config.titlePosition.y / 100) * height
  const containerPadding = 20
  const textSpacing = 10
  
  // Altura total del contenedor: título + espacio + subtítulo + padding
  const containerHeight = config.titleSize + textSpacing + (config.subtitle ? config.subtitleSize : 0) + (containerPadding * 2)
  
  // Dibujar fondo del contenedor de texto (ancho completo)
  if (config.titleBackground && config.titleBackgroundOpacity > 0) {
    ctx.fillStyle = config.titleBackground
    ctx.globalAlpha = config.titleBackgroundOpacity
    ctx.fillRect(
      0, // Ancho completo
      containerY - containerPadding,
      width, // Ancho completo
      containerHeight
    )
    ctx.globalAlpha = 1
  }

  // Calcular posición X según alineación del título
  let titleX = containerPadding
  if (config.titlePosition.align === 'center') {
    ctx.textAlign = 'center'
    titleX = width / 2
  } else if (config.titlePosition.align === 'right') {
    ctx.textAlign = 'right'
    titleX = width - containerPadding
  } else {
    ctx.textAlign = 'left'
    titleX = containerPadding
  }

  // Dibujar título
  ctx.fillStyle = config.titleColor
  const titleWeight = mapFontWeight(config.titleWeight);
  const titleFamily = getFontFamily(config.titleFont);
  const titleFontString = `${titleWeight} ${config.titleSize}px "${titleFamily}"`;
  ctx.font = titleFontString;
  ctx.fillText(config.title, titleX, containerY)

  // Dibujar subtítulo solo si existe
  if (config.subtitle && config.subtitle.trim()) {
    // Calcular posición X según alineación del subtítulo
    let subtitleX = containerPadding
    if (config.subtitlePosition.align === 'center') {
      ctx.textAlign = 'center'
      subtitleX = width / 2
    } else if (config.subtitlePosition.align === 'right') {
      ctx.textAlign = 'right'
      subtitleX = width - containerPadding
    } else {
      ctx.textAlign = 'left'
      subtitleX = containerPadding
    }

    // Dibujar subtítulo
    ctx.fillStyle = config.subtitleColor
    const subtitleFontString = `${mapFontWeight(config.subtitleWeight)} ${config.subtitleSize}px "${getFontFamily(config.subtitleFont)}"`;
    ctx.font = subtitleFontString;
    ctx.fillText(config.subtitle, subtitleX, containerY + config.titleSize + textSpacing)
  }
}

// Función auxiliar para convertir hex a RGB (igual que el individual)
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

// Crear configuración para cada tipo de miniatura
function createThumbnailConfig(
  baseConfig: ThumbnailConfig, 
  title: string, 
  subtitle: string = ''
): ThumbnailConfig {
  const newConfig = {
    ...baseConfig,
    title,
    subtitle
  };
  console.log(`🔧 Configuración creada para "${title}" - Título: ${newConfig.titleSize}px, Subtítulo: ${newConfig.subtitleSize}px`);
  return newConfig;
}

export async function POST(request: NextRequest) {
  try {
    const body: CourseForm = await request.json()
    const { courseName, unitCount, preset, units } = body
    
    console.log(`🔍 DEBUG: Preset solicitado: "${preset}"`);
    console.log(`🔍 DEBUG: Presets disponibles:`, DEFAULT_PRESETS.map(p => p.id));
    
    // Validación básica
    if (!courseName || !preset || unitCount < 1) {
      return NextResponse.json(
        { success: false, error: 'Datos del formulario inválidos', images: [] },
        { status: 400 }
      )
    }
    
    // Obtener preset base
    const selectedPreset = DEFAULT_PRESETS.find(p => p.id === preset)
    if (!selectedPreset) {
      console.log(`❌ ERROR: Preset "${preset}" no encontrado`);
      return NextResponse.json(
        { success: false, error: 'Preset no encontrado', images: [] },
        { status: 404 }
      )
    }
    
    const baseConfig = selectedPreset.config
    console.log(`✅ SUCCESS: Preset "${preset}" encontrado`);
    console.log(`📋 Preset seleccionado: ${preset}`);
    console.log(`📏 Configuración base - Título: ${baseConfig.titleSize}px, Subtítulo: ${baseConfig.subtitleSize}px`);
    console.log(`🎨 Colores - Título: ${baseConfig.titleColor}, Subtítulo: ${baseConfig.subtitleColor}`);
    console.log(`⚖️ Pesos - Título: ${baseConfig.titleWeight}, Subtítulo: ${baseConfig.subtitleWeight}`);
    console.log(`🔤 Fuentes - Título: ${baseConfig.titleFont}, Subtítulo: ${baseConfig.subtitleFont}`);
    
    const generatedImages: GenerateSetResponse['images'] = []
    
    try {
      // Generar miniaturas solo para las secciones seleccionadas
      console.log(`Generando ${unitCount} secciones seleccionadas...`)
      
      for (let i = 0; i < unitCount; i++) {
        const unitSubtitle = units[i]?.unitSubtitle || ''
        
        // Determinar el tipo y título según la posición
        let sectionType: 'presentation' | 'unit' | 'evaluation'
        let sectionTitle: string
        let unitNumber: number | undefined
        
        if (unitCount === 1) {
          // Solo una sección: será presentación
          sectionType = 'presentation'
          sectionTitle = 'Presentación del curso'
        } else if (i === 0) {
          // Primera sección: presentación
          sectionType = 'presentation'
          sectionTitle = 'Presentación del curso'
        } else if (i === unitCount - 1) {
          // Última sección: evaluación
          sectionType = 'evaluation'
          sectionTitle = 'Módulo de Evaluación'
        } else {
          // Secciones intermedias: unidades
          sectionType = 'unit'
          sectionTitle = `Unidad ${i}`
          unitNumber = i
        }
        
        console.log(`Generando ${sectionType}: "${sectionTitle}"`)
        
        const sectionConfig = createThumbnailConfig(
          baseConfig,
          sectionTitle,
          sectionType === 'evaluation' ? '' : (sectionType === 'presentation' ? courseName : unitSubtitle)
        )
        
        const sectionCanvas = createCanvas(baseConfig.width, baseConfig.height)
        const sectionCtx = sectionCanvas.getContext('2d')
        await drawThumbnail(sectionCanvas, sectionCtx, sectionConfig)
        
        const sectionBuffer = sectionCanvas.toBuffer('image/png')
        const sectionBase64 = `data:image/png;base64,${sectionBuffer.toString('base64')}`
        
        // Generar nombre de archivo
        let filename: string
        switch (sectionType) {
          case 'presentation':
            filename = `${courseName.replace(/[^a-zA-Z0-9_-]/g, '_')}_presentacion.png`
            break
          case 'evaluation':
            filename = `${courseName.replace(/[^a-zA-Z0-9_-]/g, '_')}_evaluacion.png`
            break
          case 'unit':
            filename = `${courseName.replace(/[^a-zA-Z0-9_-]/g, '_')}_unidad_${i}.png`
            break
        }
        
        const imageData: GenerateSetResponse['images'][0] = {
          type: sectionType,
          imageUrl: sectionBase64,
          filename
        }
        
        if (sectionType === 'unit' && unitNumber !== undefined) {
          imageData.unitNumber = unitNumber
        }
        
        generatedImages.push(imageData)
      }
      
      console.log(`✅ Generación completada: ${generatedImages.length} imágenes`)
      
      const response: GenerateSetResponse = {
        success: true,
        images: generatedImages
      }
      
      return NextResponse.json(response)
      
    } catch (generationError) {
      console.error('Error durante la generación de imágenes:', generationError)
      return NextResponse.json(
        { 
          success: false, 
          error: `Error generando imágenes: ${generationError instanceof Error ? generationError.message : 'Error desconocido'}`,
          images: []
        },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `Error del servidor: ${error instanceof Error ? error.message : 'Error interno del servidor'}`,
        images: []
      },
      { status: 500 }
    )
  }
}