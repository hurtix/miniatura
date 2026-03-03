# 🎨 Generador de Miniaturas para Moodle

Una aplicación web moderna para crear miniaturas atractivas y personalizables para cursos de Moodle. Construida con Next.js, Tailwind CSS, Shadcn/UI y Canvas API.

![Versión](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-blue.svg)

## ✨ Características Principales

- 🎯 **Vista previa en tiempo real** - Ve los cambios al instante
- 🎨 **3 presets predefinidos** - Corporativo, Académico y Moderno
- ⚙️ **Personalización completa** - Colores, fuentes, posiciones y más
- 📱 **Diseño responsivo** - Funciona en desktop, tablet y móvil
- 💾 **Descarga de alta calidad** - PNG optimizado con Sharp
- 🔤 **Tipografía Open Sans** - Fuente moderna y legible
- 🚀 **Rendimiento optimizado** - Generación server-side

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático para mayor robustez
- **Tailwind CSS 4** - Estilos utility-first
- **Shadcn/UI** - Componentes UI modernos y accesibles
- **React Hook Form** - Manejo de formularios eficiente
- **Zod** - Validación de datos con TypeScript

### Backend & Generación de Imágenes
- **Canvas API** - Renderizado de canvas en el cliente
- **Sharp** - Procesamiento de imágenes server-side
- **Node Canvas** - Generación de imágenes en el servidor

### Diseño
- **Open Sans** - Fuente tipográfica principal
- **Lucide React** - Iconos modernos y consistentes

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd miniatura

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir en el navegador
open http://localhost:3000
```

### Comandos Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Revisar código con ESLint
npm run type-check   # Verificar tipos TypeScript
```

## 📖 Guía de Uso

### 1. Seleccionar Preset

Elige entre 3 presets predefinidos:
- **🏢 Corporativo** - Fondo azul profesional, texto centrado
- **🎓 Académico** - Verde educativo, layout estructurado  
- **✨ Moderno** - Púrpura minimalista, tipografía elegante

### 2. Personalizar Contenido

- **Título**: Texto principal de la miniatura
- **Subtítulo**: Descripción adicional del curso

### 3. Ajustar Diseño

- **Color de fondo**: Selector de color + opacidad
- **Colores de texto**: Personalizables por separado
- **Tamaños de fuente**: Sliders para título y subtítulo
- **Posicionamiento**: Coordenadas X/Y + alineación

### 4. Descargar

- **Vista previa**: Actualización en tiempo real
- **Descarga PNG**: Alta calidad optimizada
- **API Server-side**: Generación profesional con Sharp

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   └── generate-image/     # API para generar imágenes
│   ├── globals.css             # Estilos globales + Open Sans
│   ├── layout.tsx              # Layout raíz
│   └── page.tsx                # Página principal
├── components/
│   ├── ui/                     # Componentes Shadcn/UI
│   └── thumbnail/              # Componentes del generador
│       ├── ThumbnailForm.tsx   # Formulario de configuración
│       └── ThumbnailPreview.tsx # Vista previa canvas
├── config/
│   └── presets.ts              # Presets predefinidos
├── types/
│   └── thumbnail.ts            # Tipos TypeScript
└── lib/
    └── utils.ts                # Utilidades (cn function)
```

## 🎨 Personalización

### Añadir Nuevos Presets

```typescript
// src/config/presets.ts
export const CUSTOM_PRESET: ThumbnailPreset = {
  id: 'custom',
  name: 'Mi Preset',
  description: 'Descripción personalizada',
  config: {
    // Configuración completa...
  }
};
```

### Modificar Colores del Tema

```css
/* src/app/globals.css */
:root {
  --primary: oklch(0.205 0 0);      /* Color principal */
  --secondary: oklch(0.97 0 0);     /* Color secundario */
  /* Más variables... */
}
```

### Añadir Componentes Shadcn/UI

```bash
npx shadcn@latest add dialog toast alert
```

## 🔮 Próximas Características

- [ ] **Integración Moodle API** - Subida directa a cursos
- [ ] **Biblioteca de fondos** - Imágenes predefinidas
- [ ] **Presets colaborativos** - Compartir configuraciones
- [ ] **Procesamiento por lotes** - Múltiples miniaturas
- [ ] **Plantillas avanzadas** - Layouts más complejos
- [ ] **Modo oscuro** - Tema alternativo
- [ ] **Exportar configuración** - JSON/YAML

## 🌐 Deployment

### Vercel (Recomendado)

```bash
# Conectar con Vercel
npm i -g vercel
vercel --prod

# O usar la integración de GitHub
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Reconocimientos

- [Shadcn/UI](https://ui.shadcn.com/) - Sistema de componentes
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Next.js](https://nextjs.org/) - Framework React
- [Sharp](https://sharp.pixelplumbing.com/) - Procesamiento de imágenes
- [Open Sans](https://fonts.google.com/specimen/Open+Sans) - Tipografía

---

**Generador de Miniaturas para Moodle** - Construido con ❤️ y Next.js

```
📧 ¿Preguntas? Abre un issue en GitHub
🐛 ¿Bug? Reporta en la sección Issues  
💡 ¿Idea? Discussions está abierto
```
