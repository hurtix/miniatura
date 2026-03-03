# 🎨 Generador de Miniaturas para Moodle

Un generador profesional de miniaturas para cursos de Moodle con integración directa a la API REST de Moodle, tipografía Open Sans y múltiples presets de diseño.

## ✨ Características Principales

### 🚀 **Generación de Miniaturas**
- **Generación individual**: Crear miniaturas personalizadas una a la vez
- **Generación por conjuntos**: Crear automáticamente todo el set de un curso (presentación + unidades + evaluación)
- **Tipografía Open Sans real**: Fuentes TTF registradas para máxima calidad
- **Canvas optimizado**: Renderizado server-side para mejor performance

### 🎯 **Integración con Moodle**
- **API REST nativa**: Conecta directamente con tu instancia de Moodle
- **Carga automática de secciones**: Importa los títulos de las unidades del curso
- **Configuración segura**: Tokens y credenciales en variables de entorno
- **Validación robusta**: Manejo de errores y validación de permisos

### 🎭 **Presets de Diseño**
- **Básica**: Diseño profesional azul corporativo
- **Específica**: Estilo técnico con alineación izquierda  
- **Sociohumanística**: Diseño minimalista y elegante

### 🔧 **Configuración Avanzada**
- **Tipografía completa**: Familia, peso, tamaño y color
- **Posicionamiento**: Control preciso de alineación y ubicación
- **Imagen de fondo**: Soporte para imágenes personalizadas
- **Overlays**: Capas de color con opacidad configurable

## 🏗️ Arquitectura Técnica

### **Frontend (Next.js 16)**
- ✅ React 19 con Server Components
- ✅ TypeScript para type safety
- ✅ Tailwind CSS + Shadcn/UI para UI moderna
- ✅ React Hook Form + Zod para validación

### **Backend & APIs**
- ✅ Next.js API Routes optimizadas
- ✅ Canvas server-side con Node.js
- ✅ Integración segura con Moodle REST API
- ✅ Validación de esquemas con Zod

### **Tipografía**
- ✅ Open Sans TTF convertida desde WOFF2
- ✅ Registro automático de fuentes en Canvas
- ✅ Fallback robusto para diferentes sistemas

## 🚦 Configuración

### 1. **Variables de Entorno**

Crea un archivo `.env.local`:

```env
# Configuración de Moodle API
MOODLE_BASE_URL=https://tu-moodle.edu.co/moodle
MOODLE_WS_TOKEN=tu_token_de_webservice_aqui

# Next.js
NEXTAUTH_SECRET=tu_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 2. **Instalación**

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build
npm start
```

### 3. **Configurar Moodle WebService**

1. **Habilitar Web Services** en tu Moodle:
   - `Site Administration > Advanced features`
   - Activar "Enable web services"

2. **Crear usuario de servicio**:
   - Crear usuario dedicado para API
   - Asignar rol con permisos `webservice/rest:use`

3. **Generar token**:
   - `Site Administration > Server > Web services > Manage tokens`
   - Crear token para el usuario y servicio `core_course_get_contents`

## 🎯 Uso

### **Generación Individual**
1. Configurar título, subtítulo y parámetros visuales
2. Seleccionar preset de diseño
3. Generar y descargar miniatura

### **Generación por Conjuntos + Moodle**
1. **Conectar con Moodle**:
   - Ingresar Course ID de Moodle
   - Hacer clic en "Cargar Secciones"
   - Las unidades se llenan automáticamente

2. **Configurar curso**:
   - Nombre del curso
   - Seleccionar preset visual
   - Revisar unidades importadas

3. **Generar conjunto**:
   - Se crean automáticamente: presentación + unidades + evaluación
   - Descargar individual o en lote

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── generate-image/          # API individual
│   │   ├── generate-course-set/     # API conjuntos
│   │   └── moodle/
│   │       └── course-sections/     # API Moodle integration
│   ├── globals.css                  # Open Sans + Tailwind
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                          # Shadcn/UI components
│   ├── thumbnail/                   # Generador individual
│   │   ├── ThumbnailForm.tsx
│   │   └── ThumbnailPreview.tsx
│   └── course/                      # Generador conjuntos
│       └── CourseSetForm.tsx        # Con integración Moodle
├── config/
│   └── presets.ts                   # Presets de diseño
├── lib/
│   ├── utils.ts                     # Utilidades
│   └── moodle.ts                    # Cliente API Moodle
├── types/
│   ├── thumbnail.ts                 # Tipos miniaturas
│   └── moodle.ts                    # Tipos Moodle API
└── public/
    ├── fonts/                       # Open Sans TTF
    │   ├── OpenSans-Regular.ttf
    │   └── OpenSans-Bold.ttf
    └── backgrounds/                 # Imágenes de fondo
        └── ia.jpg
```

## 🔌 API Endpoints

### **Generación de Imágenes**

```typescript
// POST /api/generate-image
{
  title: string;
  subtitle: string;
  titleColor: string;
  titleSize: number;
  titleFont: 'Open Sans' | 'Arial' | 'Helvetica';
  // ... más configuración
}
```

### **Generación de Conjuntos**

```typescript
// POST /api/generate-course-set
{
  courseName: string;
  unitCount: number;
  preset: 'basica' | 'especifica' | 'sociohumanistica';
  units: [
    { unitSubtitle: string }
  ]
}
```

### **Integración Moodle**

```typescript
// GET /api/moodle/course-sections?courseid=225
{
  success: boolean;
  courseid: number;
  sections: string[];
  count: number;
}
```

## 🛠️ Tecnologías

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| **Framework** | Next.js | 16.1.6 |
| **Runtime** | React | 19.2.3 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 3.x |
| **UI Components** | Shadcn/UI | Latest |
| **Forms** | React Hook Form | 7.x |
| **Validation** | Zod | 3.x |
| **Canvas** | node-canvas | 3.x |
| **Fonts** | @fontsource/open-sans | 5.x |

## 🤝 Contribuciones

1. Fork el repositorio
2. Crear branch de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'feat: nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🔒 Seguridad

- ✅ **Repositorio privado** para datos sensibles
- ✅ **Variables de entorno** para credenciales
- ✅ **Validación server-side** de todas las entradas  
- ✅ **No exposición de tokens** en el frontend
- ✅ **HTTPS requerido** para producción

---

**Desarrollado con ❤️ para la comunidad educativa**