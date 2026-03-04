# Compatibilidad Moodle: Prueba vs Producción

## Diferencias Principales

### Moodle de PRUEBA (Desarrollo/Testing)
✅ **Función personalizada disponible**: `local_wstemplate_update_grid_image`
- Permite actualizar automáticamente las imágenes de grid de las secciones
- Proceso completo de subida e integración
- Experiencia de usuario optimizada

**Flujo completo:**
1. Sube imagen a draft area → `core_files_upload`
2. Actualiza grid automáticamente → `local_wstemplate_update_grid_image`
3. Imagen visible inmediatamente en el curso

### Moodle de PRODUCCIÓN (Estándar)
⚠️ **Solo funciones estándar de Moodle disponibles**
- No incluye `local_wstemplate_update_grid_image`
- Las imágenes se suben al área de borradores únicamente
- Requiere intervención manual para aplicar al grid

**Flujo limitado:**
1. Sube imagen a draft area → `core_files_upload`
2. ❌ No puede actualizar grid automáticamente
3. Imagen disponible en draft area (itemid proporcionado)

## Configuración para Producción

### Variables de Entorno
```env
# Moodle de Producción
MOODLE_BASE_URL=https://tu-moodle-produccion.com
MOODLE_WS_TOKEN=tu_token_produccion

# Moodle de Prueba (para referencia)
# MOODLE_BASE_URL=https://posgrados.unicauca.edu.co/moodle
# MOODLE_WS_TOKEN=tu_token_prueba
```

### Funciones de Moodle Requeridas (Estándar)

**Mínimas para funcionamiento básico:**
- `core_course_search_courses` - Búsqueda de cursos
- `core_course_get_courses` - Información de cursos
- `core_course_get_contents` - Contenidos y secciones
- `core_files_upload` - Subida de archivos

**Opcionales para funcionalidad completa:**
- `local_wstemplate_update_grid_image` - Solo en Moodle de prueba

### Permisos Requeridos del Token

```
webservice/rest:use
moodle/course:view
moodle/course:viewparticipants
moodle/files:uploadfile
repository/upload:view
```

## Comportamiento del Sistema

### En Moodle de PRUEBA
```
✅ Búsqueda de cursos
✅ Carga de secciones
✅ Generación de miniaturas
✅ Subida automática a Moodle
✅ Actualización automática de grid
💯 Experiencia completa
```

### En Moodle de PRODUCCIÓN
```
✅ Búsqueda de cursos
✅ Carga de secciones
✅ Generación de miniaturas
✅ Subida a área de borradores
⚠️ Grid NO se actualiza automáticamente
📋 Requiere acción manual posterior
```

## Mensajes del Sistema

### Éxito con Grid Actualizado (Prueba)
> "Imagen de grid actualizada exitosamente"

### Éxito Solo Subida (Producción)  
> "Imagen subida exitosamente (itemid: 123456). Nota: Actualización automática de grid no disponible en esta instancia de Moodle."

## Pasos Manuales para Producción

Una vez subida la imagen al draft area se requiere:

1. **Ir al curso en Moodle**
2. **Activar edición**
3. **Editar la sección correspondiente**
4. **En configuración de sección:**
   - Buscar campo de imagen de sección
   - Seleccionar "Draft area files"
   - Elegir la imagen subida (usa el itemid proporcionado)
5. **Guardar cambios**

## Futuras Mejoras

### Para Moodle de Producción
- [ ] Plugin personalizado para actualización automática de grid
- [ ] Integración con `core_course_edit_section`
- [ ] Crear recurso archivo en curso automáticamente
- [ ] API personalizada para actualización de metadatos de sección

### Para Ambos Entornos
- [ ] Cache de tokens y sesiones
- [ ] Retry automático en caso de fallos
- [ ] Validación de permisos antes de subida
- [ ] Previsualización de cómo se verá en Moodle

## Solución de Problemas

### Error: "Function not available"
**Causa:** Intentando usar `local_wstemplate_update_grid_image` en producción
**Solución:** Normal, el sistema usará fallback automáticamente

### Error: "Upload failed"  
**Causa:** Token sin permisos o función `core_files_upload` no habilitada
**Solución:** Verificar permisos del token en Moodle

### Error: "Invalid itemid"
**Causa:** Problema en la subida al draft area
**Solución:** Verificar logs del servidor Moodle