# 📷 Imágenes de Fondo para Miniaturas

Este directorio contiene las imágenes de fondo disponibles para las miniaturas de Moodle.

## 🏗️ Estructura de Archivos

```
public/backgrounds/
├── corporate-bg.jpg     # Imagen corporativa (negocios, oficinas)
├── academic-bg.jpg      # Imagen académica (universidad, libros)
├── modern-bg.jpg        # Imagen moderna (tecnología, abstracta)
├── tech-bg.jpg          # Imagen tecnológica (código, circuitos)
├── nature-bg.jpg        # Imagen de naturaleza (paisajes, plantas)
└── abstract-bg.jpg      # Imagen abstracta (formas, colores)
```

## 📏 Especificaciones Recomendadas

### Dimensiones
- **Resolución mínima**: 800x450px (16:9)
- **Resolución recomendada**: 1600x900px o superior
- **Formato**: JPG, PNG o WebP
- **Tamaño de archivo**: < 500KB

### Características Visuales
- **Contraste**: Evitar imágenes muy contrastadas
- **Colores**: Preferir tonos suaves que permitan legibilidad del texto
- **Complejidad**: Fondos simples funcionan mejor con texto superpuesto

## 🎨 Sugerencias por Categoría

### Corporativa (`corporate-bg.jpg`)
- Oficinas modernas, edificios, reuniones
- Colores: Azules, grises, blancos
- Estilo: Profesional, limpio

### Académica (`academic-bg.jpg`)
- Universidades, bibliotecas, aulas
- Colores: Verdes, marrones, tonos tierra
- Estilo: Educativo, tradicional

### Moderna (`modern-bg.jpg`)
- Formas geométricas, gradientes suaves
- Colores: Púrpuras, rosas, azules vibrantes
- Estilo: Contemporáneo, minimalista

### Tecnológica (`tech-bg.jpg`)
- Circuitos, código, pantallas, datos
- Colores: Azules eléctricos, verdes neón
- Estilo: Futurista, digital

### Naturaleza (`nature-bg.jpg`)
- Paisajes, plantas, cielos, agua
- Colores: Verdes, azules natural, marrones
- Estilo: Orgánico, relajante

### Abstracta (`abstract-bg.jpg`)
- Formas libres, patrones, texturas
- Colores: Variados, artísticos
- Estilo: Creativo, experimental

## 🔧 Uso en la Aplicación

Las imágenes se referencian por su ruta relativa:
```json
{
  "backgroundImage": "/backgrounds/corporate-bg.jpg",
  "backgroundOpacity": 0.7
}
```

## 📝 Notas para Desarrolladores

- Las imágenes se cargan con `loadImage()` en el servidor
- Se escalan automáticamente al tamaño del canvas (800x450px)
- La opacidad se controla por separado del overlay de color
- Fallback automático a fondo gris si la imagen no carga

## 🚀 Cómo Añadir Nuevas Imágenes

1. Coloca tu imagen en este directorio (`public/backgrounds/`)
2. Actualiza el selector en `ThumbnailForm.tsx`:
   ```tsx
   <SelectItem value="/backgrounds/mi-nueva-imagen.jpg">
     Mi Nueva Categoría
   </SelectItem>
   ```
3. Opcionalmente, añade un nuevo preset en `presets.ts`

---

**Tip**: Usa herramientas como [Unsplash](https://unsplash.com/) o [Pexels](https://pexels.com/) para imágenes libres de derechos de alta calidad.