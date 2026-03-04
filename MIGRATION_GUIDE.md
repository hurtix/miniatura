# Guía de Migración: Moodle Prueba → Producción

## ✅ Cambios Necesarios

### 1. Actualizar Variables de Entorno

**Editar el archivo `.env.local`:**

```bash
# CAMBIAR estas líneas:
# ANTES (Moodle de Prueba)
# MOODLE_BASE_URL=https://posgrados.unicauca.edu.co/moodle
# MOODLE_WS_TOKEN=token_de_prueba

# DESPUÉS (Moodle de Producción)
MOODLE_BASE_URL=https://tu-moodle-produccion.com
MOODLE_WS_TOKEN=tu_token_de_produccion
```

### 2. Verificar Token y Permisos en Moodle de Producción

En tu Moodle de PRODUCCIÓN:

1. **Ir a:** Administración del sitio → Plugins → Servicios web → Gestionar tokens
2. **Crear token** con permisos para:
   - `webservice/rest:use`
   - `moodle/course:view` 
   - `moodle/course:viewparticipants`
   - `moodle/files:uploadfile`

3. **Habilitar servicios web:**
   - Administración → Plugins → Servicios web → Habilitar servicios web ✅

4. **Crear/editar servicio personalizado con funciones:**
   - `core_course_search_courses` ✅ (búsqueda cursos)
   - `core_course_get_courses` ✅ (info cursos)
   - `core_course_get_contents` ✅ (secciones)
   - `core_files_upload` ✅ (subir archivos)

### 3. Reiniciar Aplicación

```bash
# Parar servidor de desarrollo
pkill -f "next dev"

# Limpiar cache
rm -rf .next

# Reiniciar
npm run dev
```

## ⚠️ Diferencias Esperadas

### En Moodle de PRUEBA (antes):
- ✅ Subida + actualización automática de grid
- 💯 Experiencia completa sin intervención manual

### En Moodle de PRODUCCIÓN (después):
- ✅ Subida exitosa al área de borradores  
- ⚠️ **Requiere acción manual para aplicar al grid**
- 📋 Se proporciona `itemid` para uso manual

## 🔬 Pruebas Después del Cambio

### 1. Verificar Conexión
Abrir la aplicación y probar búsqueda de cursos:
- Debería mostrar cursos de tu Moodle de producción
- Si hay error, revisar URL y token

### 2. Probar Carga de Secciones  
- Seleccionar un curso
- Verificar que se cargan las secciones correctas

### 3. Probar Subida (Comportamiento Esperado)
- Generar miniaturas
- Hacer clic en "📤 Subir a Moodle" 
- **Mensaje esperado:** "Imagen subida exitosamente (itemid: XXXXX). Nota: Actualización automática de grid no disponible en esta instancia de Moodle."

## 📋 Pasos Manuales Después de la Subida

Para cada sección donde se subió una imagen:

1. **Ir al curso en Moodle**
2. **Activar modo de edición** 
3. **Editar la sección** (ícono de engranaje)
4. **En "Imagen de sección":**
   - Hacer clic en selector de archivos
   - Elegir "Draft area files" 
   - Buscar por el `itemid` proporcionado
   - Seleccionar la imagen correspondiente
5. **Guardar cambios**

## 🚨 Solución de Problemas

### Error: "Excepción al control de acceso"
- **Causa:** Token sin permisos o inválido
- **Solución:** Verificar token y permisos en Moodle

### Error: "Function not available"  
- **Causa:** Servicio web no habilitado o función no agregada
- **Solución:** Revisar configuración de servicios web

### Cursos no aparecen
- **Causa:** Usuario del token no tiene acceso a cursos
- **Solución:** Usar token de usuario con más permisos

### Subida falla
- **Causa:** `core_files_upload` no habilitado
- **Solución:** Agregar función al servicio web

## ✨ Resultado Final

Después del cambio:
- ✅ Búsqueda y generación funcionan igual
- ✅ Subida exitosa al área de borradores
- 📝 Requiere 1 paso manual por sección para aplicar al grid
- 🎯 Mismo resultado visual final en Moodle

## 🔄 Para Regresar a Moodle de Prueba

Si necesitas volver al entorno de prueba, simplemente cambiar en `.env.local`:

```env
MOODLE_BASE_URL=https://posgrados.unicauca.edu.co/moodle  
MOODLE_WS_TOKEN=tu_token_de_prueba
```

Y reiniciar la aplicación. ¡El código es compatible con ambos entornos!