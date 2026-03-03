'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CourseCombobox } from '@/components/ui/course-combobox';
import { DEFAULT_PRESETS } from '@/config/presets';
import type { CourseForm, GenerateSetResponse } from '@/types/thumbnail';

// Esquema de validación simplificado - courseName ahora se llena automáticamente
const courseFormSchema = z.object({
  courseName: z.string().min(1, 'El nombre del curso es requerido').max(100, 'Máximo 100 caracteres'),
  unitCount: z.number().min(1, 'Mínimo 1 unidad').max(20, 'Máximo 20 unidades'),
  preset: z.string().min(1, 'Selecciona un preset'),
  units: z.array(z.object({
    unitSubtitle: z.string().min(1, 'El subtítulo es requerido').max(80, 'Máximo 80 caracteres')
  }))
});

interface CourseSetFormProps {
  onGenerate?: (data: GenerateSetResponse) => void;
}

interface MoodleSectionsResponse {
  success: boolean;
  courseid: number;
  sections: string[];
  count: number;
}

interface SelectedCourse {
  id: number;
  fullname: string;
  shortname: string;
  categoryname: string;
  label: string;
  value: string;
}

export function CourseSetForm({ onGenerate }: CourseSetFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSet, setGeneratedSet] = useState<GenerateSetResponse | null>(null);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [moodleSections, setMoodleSections] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);
  const [moodleError, setMoodleError] = useState<string>('');

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
      courseName: '',
      unitCount: 4,
      preset: 'basica',
      units: [
        { unitSubtitle: '' },
        { unitSubtitle: '' },
        { unitSubtitle: '' },
        { unitSubtitle: '' }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'units'
  });

  const unitCount = watch('unitCount');
  const courseName = watch('courseName');

  // Ajustar número de unidades dinámicamente
  const adjustUnits = (newCount: number) => {
    const currentCount = fields.length;
    
    if (newCount > currentCount) {
      // Agregar unidades
      for (let i = currentCount; i < newCount; i++) {
        append({ unitSubtitle: '' });
      }
    } else if (newCount < currentCount) {
      // Remover unidades
      for (let i = currentCount - 1; i >= newCount; i--) {
        remove(i);
      }
    }
  };

  // Manejar cambio de cantidad de unidades
  const handleUnitCountChange = (value: string) => {
    const count = parseInt(value);
    if (!isNaN(count) && count >= 1 && count <= 20) {
      setValue('unitCount', count);
      adjustUnits(count);
    }
  };

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
        setMoodleSections(result.sections);
        
        // Actualizar automáticamente el formulario
        setValue('unitCount', result.sections.length);
        adjustUnits(result.sections.length);
        
        // Llenar los subtítulos automáticamente
        result.sections.forEach((sectionName, index) => {
          setValue(`units.${index}.unitSubtitle`, sectionName);
        });
      } else {
        setMoodleError('No se encontraron secciones en este curso');
      }
    } catch (error) {
      console.error('Error loading Moodle sections:', error);
      setMoodleError(error instanceof Error ? error.message : 'Error desconocido al cargar las secciones');
    } finally {
      setIsLoadingSections(false);
    }
  };

  // Manejar selección de curso desde el combobox
  const handleCourseSelect = (course: SelectedCourse | null) => {
    setSelectedCourse(course);
    setMoodleError('');
    setMoodleSections([]);
    
    if (course) {
      // Llenar automáticamente el nombre del curso
      setValue('courseName', course.fullname);
      
      // Cargar las secciones automáticamente
      loadMoodleSections(course);
    } else {
      // Limpiar formulario si se deselecciona
      setValue('courseName', '');
    }
  };

  // Limpiar datos de Moodle
  const clearMoodleData = () => {
    setSelectedCourse(null);
    setMoodleSections([]);
    setMoodleError('');
    setValue('courseName', ''); // Limpiar también el nombre
  };

  const onSubmit = async (data: CourseForm) => {
    setIsGenerating(true);
    setGeneratedSet(null); // Limpiar resultados anteriores
    
    try {
      console.log('📤 Enviando datos al API:', data);
      console.log('Preset seleccionado:', data.preset);
      
      const response = await fetch('/api/generate-course-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
            
            {/* Información básica del curso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseName">Nombre del Curso</Label>
                <Input
                  id="courseName"
                  {...register('courseName')}
                  placeholder="Ej: Introducción a la Programación"
                />
                {errors.courseName && (
                  <p className="text-sm text-red-500">{errors.courseName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preset">Preset Visual</Label>
                <Select onValueChange={(value) => setValue('preset', value)} defaultValue="basica">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_PRESETS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name} - {preset.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.preset && (
                  <p className="text-sm text-red-500">{errors.preset.message}</p>
                )}
              </div>
            </div>

            {/* Cantidad de unidades */}
            <div className="space-y-2">
              <Label htmlFor="unitCount">Cantidad de Unidades</Label>
              <Input
                id="unitCount"
                type="number"
                min="1"
                max="20"
                value={unitCount}
                onChange={(e) => handleUnitCountChange(e.target.value)}
                className="w-32"
              />
              {errors.unitCount && (
                <p className="text-sm text-red-500">{errors.unitCount.message}</p>
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
                        🔄 Cargando secciones de "{selectedCourse.fullname}"...
                      </p>
                    </div>
                  </div>
                )}

                {moodleError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">❌ {moodleError}</p>
                  </div>
                )}

                {moodleSections.length > 0 && selectedCourse && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-green-800">
                          ✅ Curso cargado exitosamente
                        </p>
                        <p className="text-xs text-green-600">
                          {moodleSections.length} secciones encontradas
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearMoodleData}
                      >
                        🗑️ Cambiar Curso
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-green-800 mb-2">
                        📚 Unidades del curso:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {moodleSections.map((section, index) => (
                          <div key={index} className="p-2 bg-white rounded border text-xs flex items-start gap-2">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex-shrink-0">
                              {index + 1}
                            </Badge>
                            <p className="text-gray-700 flex-1 break-words" title={section}>
                              {section}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vista previa de miniaturas que se generarán */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Miniaturas que se generarán:</h3>
              
              <div className="space-y-3">
                {/* Presentación */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <Badge variant="secondary">Presentación</Badge>
                    <p className="font-semibold text-blue-800">Presentación del curso</p>
                    <p className="text-sm text-blue-600">{courseName || 'Nombre del curso aquí'}</p>
                  </div>
                  <span className="text-2xl">📚</span>
                </div>

                {/* Unidades */}
                {fields.map((field, index) => (
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
                    <span className="text-2xl ml-4">📖</span>
                  </div>
                ))}

                {/* Evaluación */}
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <Badge variant="secondary">Evaluación</Badge>
                    <p className="font-semibold text-orange-800">Módulo de Evaluación</p>
                    <p className="text-sm text-orange-600">Sin subtítulo</p>
                  </div>
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            {/* Botón de generar */}
            <Button 
              type="submit" 
              disabled={isGenerating} 
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generando {fields.length + 2} miniaturas...
                  <br />
                  <span className="text-xs opacity-75">Esto puede tomar unos segundos</span>
                </>
              ) : (
                <>
                  ✨ Generar {fields.length + 2} Miniaturas del Curso ✨
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
                      Presentación + {unitCount} Unidades + Evaluación = {fields.length + 2} imágenes
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
            <div className="mt-6 p-4 border rounded-lg">
              {generatedSet.success ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-green-700">
                      ✅ Conjunto generado exitosamente
                    </h3>
                    <Button onClick={downloadAll} variant="outline">
                      Descargar Todas ({generatedSet.images.length})
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedSet.images.map((image, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="aspect-video bg-gray-100 rounded mb-2">
                          <img 
                            src={image.imageUrl} 
                            alt={image.filename}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{image.filename}</p>
                          <Badge variant={
                            image.type === 'presentation' ? 'default' :
                            image.type === 'unit' ? 'secondary' : 'destructive'
                          }>
                            {image.type === 'presentation' ? 'Presentación' :
                             image.type === 'unit' ? `Unidad ${image.unitNumber}` : 'Evaluación'}
                          </Badge>
                          <br />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = image.imageUrl;
                              link.download = image.filename;
                              link.click();
                            }}
                          >
                            Descargar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-red-700">
                  <h3 className="font-semibold">❌ Error al generar</h3>
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