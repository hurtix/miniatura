# Guía de Pruebas - Sistema de Integración Moodle

## Preparación del Entorno

### 1. Configurar Variables de Entorno

Crear archivo `.env.local`:

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:

```env
MOODLE_BASE_URL=https://tu-moodle.ejemplo.com
MOODLE_WS_TOKEN=tu_token_de_webservice_aqui
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

## Pruebas del Sistema Completo

### Prueba 1: Búsqueda de Cursos

1. Ve a la aplicación en tu navegador
2. En el campo "Curso de Moodle", escribe al menos 3 caracteres
3. Verifica que aparezcan cursos sugeridos
4. Selecciona un curso de la lista

**Resultado esperado:** Automáticamente se deben cargar las secciones del curso seleccionado.

### Prueba 2: Verificación de API Directa

Probar las APIs directamente:

```bash
# Buscar cursos
curl "http://localhost:3000/api/moodle/search-courses?query=matematicas"

# Obtener secciones (reemplaza 123 con un ID real)
curl "http://localhost:3000/api/moodle/course-sections?courseId=123"
```

### Prueba 3: Selección de Secciones

1. Una vez cargadas las secciones, usa los checkboxes para seleccionar las deseadas
2. Observa que el número de unidades se actualiza automáticamente
3. Verifica que los subtítulos se llenan con los nombres de las secciones

**Resultado esperado:** El formulario se adapta dinámicamente a las secciones seleccionadas.

### Prueba 4: Generación de Miniaturas

1. Configura los parámetros de diseño (colores, etc.)
2. Haz clic en "Generar Miniaturas"
3. Espera a que se generen todas las imágenes

**Resultado esperado:** Se deben generar 3 tipos de imágenes:
- 1 Presentación del curso
- N Unidades (según secciones seleccionadas)  
- 1 Módulo de evaluación

### Prueba 5: Subida a Moodle

1. Una vez generadas las miniaturas, busca el botón "📤 Subir a Moodle"
2. Haz clic para iniciar la subida
3. Observa el progreso en tiempo real

**Resultado esperado:** 
- Progreso mostrado para cada imagen
- Resumen final con éxitos/fallos
- Imágenes visibles en Moodle

## Comandos de Debugging

### Ver Logs del Servidor

```bash
npm run dev | grep -E "(API|Moodle|Error)"
```

### Validar Build de Producción

```bash
npm run build
npm start
```

### Limpiar Cache

```bash
rm -rf .next
npm run build
```

## Pruebas de Error Comunes

### Error de Conexión a Moodle

1. Verifica conectividad:

```bash
curl -I $MOODLE_BASE_URL
```

2. Prueba token directamente:

```bash
curl "$MOODLE_BASE_URL/webservice/rest/server.php?wstoken=$MOODLE_WS_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

### Error de Tamaño de Imagen

Probar con imagen grande (>10MB):

```bash
# Crear imagen de prueba grande
convert -size 5000x5000 xc:red test_large.png

# Intentar subir vía API (debe fallar por tamaño)
curl -X POST http://localhost:3000/api/update-grid-image \
  -F "courseId=123" \
  -F "sectionId=456" \
  -F "image=@test_large.png"
```

### Error de Permisos

1. Verifica permisos del token en Moodle
2. Prueba con un usuario administrador
3. Revisa logs de Moodle: `/path/to/moodle/admin/settings.php?section=debugging`

## Métricas de Rendimiento

### Tiempo de Generación

Las miniaturas deben generarse en:
- 1-3 imágenes: < 5 segundos
- 4-6 imágenes: < 10 segundos  
- 7+ imágenes: < 15 segundos

### Tiempo de Subida

La subida a Moodle debe completarse en:
- Por imagen: < 3 segundos
- Conjunto completo: < 30 segundos

## Casos de Prueba Específicos

### Caso 1: Curso Sin Secciones
- Seleccionar curso que no tenga secciones visibles
- Verificar manejo adecuado del error

### Caso 2: Token Inválido
- Usar token incorrecto en `.env.local`
- Verificar mensaje de error claro al usuario

### Caso 3: Moodle No Disponible
- Desconectar red temporalmente
- Verificar timeout y mensaje de error

### Caso 4: Imagen Corrupta
- Intentar generar con parámetros que causen error
- Verificar que no se bloquee la aplicación

## Checklist de Funcionalidades ✅

- [ ] Búsqueda de cursos funciona
- [ ] Carga de secciones automática  
- [ ] Selección múltiple de secciones
- [ ] Generación de miniaturas exitosa
- [ ] Subida a Moodle completada
- [ ] Error handling funciona
- [ ] UI responsive en mobile
- [ ] Performance dentro de límites
- [ ] Logs informativos disponibles

## Comandos de Producción

### Deploy en Vercel

```bash
vercel --prod
```

### Variables en Producción

```bash
vercel secrets add moodle-base-url "https://tu-moodle.com"
vercel secrets add moodle-ws-token "token_secreto"
```

### Monitoreo

```bash
# Ver logs en tiempo real
vercel logs --follow

# Analytics de uso  
vercel analytics
```