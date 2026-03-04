'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CourseCombobox } from '@/components/ui/course-combobox';
import initialPresets from '@/config/presets.json';
import type { CourseForm, GenerateSetResponse, ThumbnailPreset } from '@/types/thumbnail';
import { Download, Triangle } from 'lucide-react';

// Esquema de validación simplificado - courseName ahora se llena automáticamente
const courseFormSchema = z.object({
  preset: z.string().min(1, 'Selecciona un preset'),
  units: z.array(z.object({
    unitSubtitle: z.string().min(1, 'El subtítulo es requerido').max(50, 'Máximo 50 caracteres'),
  })).optional().default([]),
});

interface CourseSetFormProps {
  onGenerate?: (data: GenerateSetResponse) => void;
}

interface MoodleSectionsResponse {
  success: boolean;
  courseid: number;
  sections: {
    id: number;
    name: string;
    section: number;
  }[];
  sectionsCount: number;
}

interface MoodleSection {
  id: string;
  name: string;
  selected: boolean;
}

interface SelectedCourse {
  id: number;
  fullname: string;
  shortname: string;
  categoryname: string;
  label: string;
  value: string;
}

interface MoodleUploadResult {
  sectionId: string;
  sectionName: string;
  success: boolean;
  error?: string;
  filename?: string;
  contenthash?: string;
}

export function CourseSetForm({ onGenerate }: CourseSetFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSet, setGeneratedSet] = useState<GenerateSetResponse | null>(null);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [moodleSections, setMoodleSections] = useState<MoodleSection[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);
  const [moodleError, setMoodleError] = useState<string>('');
  const [availablePresets, setAvailablePresets] = useState<ThumbnailPreset[]>([]);
  
  // Estados para la subida a Moodle
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadResults, setUploadResults] = useState<MoodleUploadResult[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CourseForm>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      preset: 'basica',
      units: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: 'units'
  });

  // Solo mostrar cuando hay secciones de Moodle seleccionadas
  const selectedSections = moodleSections.filter(s => s.selected);

  // Cargar presets desde localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('allPresets');
    if (savedPresets) {
      try {
        const allPresets = JSON.parse(savedPresets);
        setAvailablePresets(allPresets);
      } catch (error) {
        console.error('Error loading presets:', error);
        setAvailablePresets(initialPresets as ThumbnailPreset[]);
      }
    } else {
      setAvailablePresets(initialPresets as ThumbnailPreset[]);
    }
  }, []);

  // Cargar secciones desde Moodle cuando se selecciona un curso
  const loadMoodleSections = async (course: SelectedCourse) => {
    setIsLoadingSections(true);
    setMoodleError('');
    setMoodleSections([]);

    try {
      const response = await fetch(`/api/moodle/course-sections?courseid=${course.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar las secciones del curso');
      }

      const result: MoodleSectionsResponse = await response.json();
      
      if (result.success && result.sections.length > 0) {
        const sectionsWithSelection = result.sections.map((section) => ({
          id: section.id.toString(), // Usar el ID real de Moodle
          name: section.name,
          selected: true // Por defecto todas seleccionadas
        }));
        setMoodleSections(sectionsWithSelection);
        
        // Actualizar automáticamente el formulario
        replace(result.sections.map(() => ({ unitSubtitle: '' })));
        
        // Llenar los subtítulos automáticamente
        result.sections.forEach((section, index) => {
          setValue(`units.${index}.unitSubtitle`, section.name);
        });
      } else {
        setMoodleError('No se encontraron secciones en este curso');
        setMoodleSections([]);
        replace([]);
      }
    } catch (error) {
      console.error('Error loading Moodle sections:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar las secciones';
      setMoodleError(errorMessage);
      setMoodleSections([]);
      replace([]);
    } finally {
      setIsLoadingSections(false);
    }
  };

  // Manejar selección de curso desde el combobox
  const handleCourseSelect = (course: SelectedCourse | null) => {
    setSelectedCourse(course);
    setMoodleError('');
    setMoodleSections([]);
    replace([]);
    
    if (course) {
      // Cargar las secciones automáticamente
      loadMoodleSections(course);
    }
  };

  // Toggle selección de una sección específica
  const toggleSectionSelection = (sectionId: string) => {
    setMoodleSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, selected: !section.selected }
          : section
      )
    );
  };

  // Toggle todas las secciones
  const toggleAllSections = (selected: boolean) => {
    setMoodleSections(prev => 
      prev.map(section => ({ ...section, selected }))
    );
  };

  // Aplicar secciones seleccionadas al formulario
  const applySelectedSections = () => {
    const selectedNames = selectedSections.map(section => section.name);
    
    // Actualizar campos del formulario
    replace(selectedNames.map(name => ({ unitSubtitle: name })));
  };

  // Efecto para actualizar subtítulos cuando cambian las secciones seleccionadas
  useEffect(() => {
    if (moodleSections.length > 0) {
      const selectedNames = selectedSections.map(section => section.name);
      replace(selectedNames.map(name => ({ unitSubtitle: name })));
    }
  }, [selectedSections.length, moodleSections.length, replace]);

  const onSubmit = async (data: CourseForm) => {
    if (selectedSections.length === 0) {
      setMoodleError('Debes seleccionar al menos una sección del curso de Moodle');
      return;
    }

    // Encontrar el preset completo
    const selectedPreset = availablePresets.find(p => p.id === data.preset);
    if (!selectedPreset) {
      setMoodleError('Preset seleccionado no encontrado');
      return;
    }

    setIsGenerating(true);
    setGeneratedSet(null);
    
    try {
      const requestData = {
        ...data,
        presetConfig: selectedPreset.config, // Enviar configuración completa
        courseName: selectedCourse?.fullname || 'Curso de Moodle',
        unitCount: selectedSections.length,
        units: selectedSections.map((section, index) => ({
          unitSubtitle: data.units?.[index]?.unitSubtitle || section.name
        }))
      };
      
      const response = await fetch('/api/generate-course-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Respuesta recibida:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el conjunto de miniaturas');
      }

      const result: GenerateSetResponse = await response.json();
      console.log('Resultado:', result);
      
      if (result.success) {
        setGeneratedSet(result);
        onGenerate?.(result);
      } else {
        throw new Error(result.error || 'Error desconocido en la generación');
      }
    } catch (error) {
      console.error('Error generating course set:', error);
      setGeneratedSet({
        success: false,
        images: [],
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAll = () => {
    if (!generatedSet?.success) return;
    
    generatedSet.images.forEach((image, index) => {
      // Crear un link temporal para descargar cada imagen
      const link = document.createElement('a');
      link.href = image.imageUrl;
      link.download = image.filename;
      document.body.appendChild(link);
      
      // Descargar con un pequeño delay para evitar problemas del navegador
      setTimeout(() => {
        link.click();
        document.body.removeChild(link);
      }, index * 200);
    });
  };

  const uploadToMoodle = async () => {
    if (!generatedSet?.success || !selectedCourse || selectedSections.length === 0) {
      console.error('No hay imágenes generadas, curso seleccionado o secciones para subir');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Preparando subida...');
    setUploadResults([]);
    
    try {
      // Subir TODAS las imágenes generadas, no solo las de unidades
      const allImages = generatedSet.images;
      const results: MoodleUploadResult[] = [];
      
      console.log(`🚀 Iniciando subida de ${allImages.length} imágenes para ${selectedSections.length} secciones`);
      
      for (let index = 0; index < allImages.length && index < selectedSections.length; index++) {
        const image = allImages[index];
        const section = selectedSections[index];
        
        if (!section) {
          console.warn(`⚠️ No hay sección para imagen ${index + 1}`);
          continue;
        }
        
        setUploadProgress(`Subiendo imagen ${index + 1} de ${allImages.length}: ${section.name}`);
        console.log(`📤 Subiendo ${image.type} para sección "${section.name}" (ID: ${section.id})`);
        
        try {
          // Descargar la imagen generada como Blob
          const response = await fetch(image.imageUrl);
          if (!response.ok) {
            throw new Error(`Error al descargar imagen: ${response.status}`);
          }
          
          const imageBlob = await response.blob();
          console.log(`📦 Imagen descargada, tamaño: ${imageBlob.size} bytes`);
          
          // Crear FormData para el upload
          const formData = new FormData();
          formData.append('courseId', selectedCourse.id.toString());
          formData.append('sectionId', section.id.toString()); 
          formData.append('image', imageBlob, `section_${section.id}_${Date.now()}.png`);
          
          console.log(`🔄 Enviando a API: courseId=${selectedCourse.id}, sectionId=${section.id}`);
          
          // Subir a Moodle
          const uploadResponse = await fetch('/api/update-grid-image', {
            method: 'POST',
            body: formData,
          });
          
          const uploadResult = await uploadResponse.json();
          console.log(`📋 Respuesta API para sección ${section.id}:`, uploadResult);
          
          if (uploadResponse.ok && uploadResult.success) {
            results.push({
              sectionId: section.id,
              sectionName: section.name,
              success: true,
              filename: uploadResult.data?.filename,
              contenthash: uploadResult.data?.contenthash,
            });
            console.log(`✅ Éxito para sección: ${section.name}`);
          } else {
            const errorMsg = uploadResult.error || 'Error desconocido en la subida';
            results.push({
              sectionId: section.id,
              sectionName: section.name,
              success: false,
              error: errorMsg,
            });
            console.error(`❌ Error para sección ${section.name}:`, errorMsg);
          }
        } catch (error) {
          console.error(`💥 Exception uploading to section ${section.name}:`, error);
          results.push({
            sectionId: section.id,
            sectionName: section.name,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
        
        // Delay más largo entre uploads para evitar rate limiting
        if (index < allImages.length - 1) {
          console.log(`⏳ Esperando 1.5 segundos antes de la siguiente subida...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      setUploadResults(results);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      if (failed === 0) {
        setUploadProgress(`✅ Subida completada: ${successful} imágenes subidas exitosamente`);
      } else {
        setUploadProgress(`⚠️ Subida completada: ${successful} exitosas, ${failed} fallidas`);
      }
    } catch (error) {
      console.error('Error general en la subida:', error);
      setUploadProgress('❌ Error en el proceso de subida');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generar Conjunto de Miniaturas del Curso</CardTitle>
          <CardDescription>
            Genera automáticamente todas las miniaturas necesarias para un curso: presentación, unidades y evaluación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Solo preset visual - curso se selecciona desde Moodle */}
            <div className="space-y-2">
              <Label htmlFor="preset">Preset Visual</Label>
              <Select onValueChange={(value) => setValue('preset', value)} defaultValue="basica">
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un preset" />
                </SelectTrigger>
                <SelectContent>
                  {availablePresets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.preset && (
                <p className="text-sm text-red-500">{errors.preset.message}</p>
              )}
            </div>

            {/* Integración con Moodle */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  🎯 Seleccionar Curso de Moodle
                  <Badge variant="secondary">Automático</Badge>
                </CardTitle>
                <CardDescription>
                  Busca y selecciona tu curso de Moodle. El nombre del curso y las secciones se cargarán automáticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Buscar Curso</Label>
                  <CourseCombobox
                    value={selectedCourse?.value}
                    onSelect={handleCourseSelect}
                    placeholder="Buscar por nombre del curso..."
                    disabled={isLoadingSections}
                  />
                  {selectedCourse && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        ID: {selectedCourse.id}
                      </Badge>
                      <span>•</span>
                      <span>{selectedCourse.categoryname}</span>
                      <span>•</span>
                      <span>{selectedCourse.shortname}</span>
                    </div>
                  )}
                </div>

                {isLoadingSections && selectedCourse && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-blue-700">
                        Cargando secciones de "{selectedCourse.fullname}"...
                      </p>
                    </div>
                  </div>
                )}

                {moodleError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{moodleError}</p>
                  </div>
                )}

                {moodleSections.length > 0 && selectedCourse && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-green-800">
                          Curso cargado exitosamente
                        </p>
                        <p className="text-xs text-green-600">
                          {moodleSections.length} secciones encontradas
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCourseSelect(null)}
                      >
                        Cambiar Curso
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vista previa de miniaturas que se generarán */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Miniaturas que se generarán:</h3>
                {moodleSections.length > 0 && (
                  <div className="flex items-center gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllSections(true)}
                      className="text-xs rounded-tr-none rounded-br-none"
                    >
                      Todas
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllSections(false)}
                      className="text-xs rounded-tl-none rounded-bl-none border-l-0"
                    >
                      Ninguna
                    </Button>
                  </div>
                )}
              </div>
              {moodleSections.length > 0 && (
                <div className="text-sm text-blue-600 mb-3">
                  {selectedSections.length} de {moodleSections.length} secciones seleccionadas para generar
                </div>
              )}
              
              <div className="space-y-3">
                {/* Unidades basadas en secciones de Moodle */}
                {moodleSections.length > 0 ? (
                  // Mostrar todas las secciones con checkboxes para seleccionar
                  moodleSections.map((section, index) => {
                    const isSelected = section.selected;
                    const selectedIndex = selectedSections.findIndex(s => s.id === section.id);
                    // Calcular el número de unidad dinámico basado en las secciones seleccionadas hasta esta posición
                    const selectedUnitNumber = moodleSections
                      .slice(0, index + 1)
                      .filter(s => s.selected).length;
                    const displayUnitNumber = isSelected ? selectedUnitNumber : index + 1;
                    
                    // Determinar si es primera o última sección seleccionada
                    const isFirstSelected = isSelected && selectedSections.findIndex(s => s.id === section.id) === 0;
                    const isLastSelected = isSelected && selectedSections.findIndex(s => s.id === section.id) === selectedSections.length - 1;
                    
                    // Determinar el número de unidad intermedia (excluyendo primera y última)
                    let intermediateUnitNumber = displayUnitNumber;
                    if (isSelected && selectedSections.length > 2) {
                      const sectionIndex = selectedSections.findIndex(s => s.id === section.id);
                      if (sectionIndex > 0 && sectionIndex < selectedSections.length - 1) {
                        intermediateUnitNumber = sectionIndex; // Unidad 1, 2, 3... para las intermedias
                      }
                    }
                    
                    // Determinar el nombre apropiado
                    let sectionTitle = `Unidad ${displayUnitNumber}`;
                    let sectionBadge = "Unidad";
                    if (isFirstSelected) {
                      sectionTitle = "Presentación del curso";
                      sectionBadge = "Presentación";
                    } else if (isLastSelected && selectedSections.length > 1) {
                      sectionTitle = "Módulo de Evaluación";
                      sectionBadge = "Evaluación";
                    } else if (isSelected && selectedSections.length > 2) {
                      sectionTitle = `Unidad ${intermediateUnitNumber}`;
                      sectionBadge = "Unidad";
                    }
                    
                    return (
                      <div
                        key={section.id}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          isSelected
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-100 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`unit-${section.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleSectionSelection(section.id)}
                            className="flex-shrink-0 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={isSelected ? "default" : "secondary"}>
                                {isSelected ? 
                                  sectionBadge + (sectionBadge === "Unidad" ? ` ${intermediateUnitNumber}` : "") : 
                                  `Unidad ${displayUnitNumber}`
                                }
                              </Badge>
                              {!isSelected && (
                                <Badge variant="outline" className="text-xs">
                                  No se generará
                                </Badge>
                              )}
                            </div>
                            <p className={`font-semibold ${
                              isSelected ? 'text-green-800' : 'text-gray-500'
                            }`}>
                              {isSelected ? sectionTitle : `Unidad ${displayUnitNumber}`}
                            </p>
                            <div className="mt-2">
                              {isSelected && selectedIndex >= 0 ? (
                                <>
                                  <Input
                                    {...register(`units.${selectedIndex}.unitSubtitle`)}
                                    placeholder={
                                      isFirstSelected ? `Subtítulo para ${sectionTitle}` :
                                      isLastSelected && selectedSections.length > 1 ? `Subtítulo para ${sectionTitle}` :
                                      `Subtítulo para ${sectionTitle}`
                                    }
                                    className="bg-white"
                                    key={`unit-input-${section.id}-${selectedIndex}`}
                                  />
                                  {errors.units?.[selectedIndex]?.unitSubtitle && (
                                    <p className="text-sm text-red-500 mt-1">
                                      {errors.units[selectedIndex]?.unitSubtitle?.message}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <div className="p-2 bg-gray-100 rounded text-sm text-gray-500 italic">
                                  {section.name} (No se generará)
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Vista tradicional sin Moodle
                  fields.map((field, index) => (
                    <div key={field.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex-1">
                        <Badge variant="secondary">Unidad {index + 1}</Badge>
                        <p className="font-semibold text-green-800">Unidad {index + 1}</p>
                        <div className="mt-2">
                          <Input
                            {...register(`units.${index}.unitSubtitle`)}
                            placeholder={`Subtítulo para Unidad ${index + 1}`}
                            className="bg-white"
                          />
                          {errors.units?.[index]?.unitSubtitle && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.units[index]?.unitSubtitle?.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Control de selección si hay secciones de Moodle */}
                {moodleSections.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700">
                      {selectedSections.length} de {moodleSections.length} secciones seleccionadas
                    </div>
                    <div className="flex items-center gap-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAllSections(true)}
                        className="text-xs rounded-tr-none rounded-br-none"
                      >
                        Todas
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAllSections(false)}
                        className="text-xs rounded-tl-none rounded-bl-none border-l-0"
                      >
                        Ninguna
                      </Button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Botón de generar */}
            <Button 
              type="submit" 
              disabled={isGenerating || selectedSections.length === 0} 
              className="w-fit"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2"><Triangle /></span>
                  Generando {selectedSections.length} miniaturas...
                </>
              ) : (
                <>
                  {selectedSections.length > 0 
                    ? `Generar ${selectedSections.length} Miniaturas del Curso` 
                    : 'Selecciona un curso de Moodle primero'
                  }
                </>
              )}
            </Button>

            {/* Indicador de progreso mejorado */}
            {isGenerating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <div>
                    <p className="font-medium text-blue-900">Generando miniaturas...</p>
                    <p className="text-sm text-blue-600">
                      Generando {selectedSections.length} miniaturas del curso
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      Por favor mantén esta pestaña abierta hasta que termine
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Resultados */}
          {generatedSet && (
            <div className="mt-6 p-4 border rounded-lg bg-muted">
              {generatedSet.success ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold leading-tight">
                      Conjunto generado exitosamente
                    </h3>
                    <div className="flex gap-2">
                      <Button onClick={downloadAll} variant="outline" size="sm">
                        Descargar Todas ({generatedSet.images.length})
                      </Button>
                      
                      {/* Botón de subir a Moodle - solo si hay curso y secciones seleccionadas */}
                      {selectedCourse && selectedSections.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <Button 
                            onClick={uploadToMoodle} 
                            variant="destructive"
                            size="sm"
                            disabled={isUploading}
                            className="w-fit ml-auto"
                          >
                            {isUploading ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                Subiendo...
                              </>
                            ) : (
                              <>
                                 Subir a Moodle ({selectedSections.length} secciones)
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progreso de subida a Moodle */}
                  {isUploading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <div>
                          <p className="font-medium text-blue-900">Subiendo a Moodle</p>
                          <p className="text-sm text-blue-600">{uploadProgress}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resultados de subida a Moodle */}
                  {uploadResults.length > 0 && (
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Resultados de subida a Moodle:
                      </h4>
                      <div className="space-y-2">
                        {uploadResults.map((result, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${
                            result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            <div>
                              <span className="font-medium">{result.sectionName}</span>
                              {result.success && result.filename && (
                                <span className="text-sm ml-2">({result.filename})</span>
                              )}
                            </div>
                          <div className="text-sm">
                              {result.success ? '✅ Exitoso' : `❌ ${result.error}`}
                            </div>  
                          </div>
                        ))}
                      </div>
                      
                      {!isUploading && (
                        <div className="mt-3 p-2 bg-white rounded border">
                          <p className="text-sm text-gray-600">{uploadProgress}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedSet.images.map((image, index) => (
                      <div key={index} className="border bg-white relative rounded-lg p-3">
                        <div className="aspect-video bg-gray-100 rounded mb-2">
                          <img 
                            src={image.imageUrl} 
                            alt={image.filename}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium break-words">{image.filename}</p>
                          <Badge
                          className='absolute top-5 left-5'
                           variant={
                            image.type === 'presentation' ? 'default' :
                            image.type === 'unit' ? 'secondary' : 'default'
                          }>
                            {image.type === 'presentation' ? 'Presentación' :
                             image.type === 'unit' ? `Unidad ${image.unitNumber}` : 'Evaluación'}
                          </Badge>
                          {/* <br /> */}
                          <Button 
                            variant="outline" 
                            size="icon-xs" 
                            className="ml-0"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = image.imageUrl;
                              link.download = image.filename;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-red-700">
                  <h3 className="font-semibold">Error al generar</h3>
                  <p>{generatedSet.error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}