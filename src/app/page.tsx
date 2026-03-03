'use client';

import { useState } from 'react';
import { ThumbnailForm } from '@/components/thumbnail/ThumbnailForm';
import { ThumbnailPreview } from '@/components/thumbnail/ThumbnailPreview';
import { CourseSetForm } from '@/components/course/CourseSetForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_PRESETS } from '@/config/presets';
import type { ThumbnailConfig, GenerateSetResponse } from '@/types/thumbnail';

export default function Home() {
  const [config, setConfig] = useState<ThumbnailConfig>(DEFAULT_PRESETS[0].config);
  const [activeTab, setActiveTab] = useState('individual');

  const handlePresetSelect = (presetId: string) => {
    const preset = DEFAULT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setConfig(preset.config);
    }
  };

  const handleConfigChange = (newConfig: ThumbnailConfig) => {
    setConfig(newConfig);
  };

  const handleCourseSetGenerated = (data: GenerateSetResponse) => {
    console.log('Course set generated:', data);
    // Aquí podrías manejar la respuesta, como mostrar notificaciones, etc.
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Generador de Miniaturas para Moodle
              </h1>
              <p className="text-muted-foreground mt-2">
                Crea miniaturas profesionales para tus cursos - individual o conjuntos completos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">v2.0</Badge>
              <Badge variant="outline">Next.js</Badge>
              <Badge variant="outline">Conjuntos</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              Miniatura Individual
            </TabsTrigger>
            <TabsTrigger value="course-set" className="flex items-center gap-2">
              Conjunto Completo de Curso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Panel de Configuración */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración Individual</CardTitle>
                    <CardDescription>
                      Personaliza tu miniatura con control total sobre cada elemento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ThumbnailForm
                      config={config}
                      onChange={handleConfigChange}
                      onPresetSelect={handlePresetSelect}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Panel de Vista Previa */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vista Previa en Tiempo Real</CardTitle>
                    <CardDescription>
                      Los cambios se reflejan instantáneamente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ThumbnailPreview config={config} />
                  </CardContent>
                </Card>

                {/* Información de la Configuración Actual */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detalles de la Configuración</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-4 md:grid-cols-2 text-sm">
                      <div>
                        <dt className="font-medium text-muted-foreground">Dimensiones</dt>
                        <dd>{config.width} × {config.height} px</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Título</dt>
                        <dd>{config.title.length}/50 caracteres</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Color Principal</dt>
                        <dd>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: config.overlayColor }}
                            />
                            {config.overlayColor}
                          </div>
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Fuente</dt>
                        <dd>{config.titleFont}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="course-set">
            <div className="max-w-5xl mx-auto">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Generador de Conjunto Completo</CardTitle>
                  <CardDescription>
                    Genera automáticamente todas las miniaturas necesarias para un curso completo: 
                    presentación + unidades + evaluación
                  </CardDescription>
                </CardHeader>
              </Card>

              <CourseSetForm onGenerate={handleCourseSetGenerated} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer informativo */}
        <footer className="mt-16 pt-8 border-t">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-3">Generador Individual</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Control total sobre diseño</li>
                <li>Vista previa en tiempo real</li>
                <li>3 presets predefinidos</li>
                <li>Personalización completa</li>
                <li>Descarga de alta calidad</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Conjunto Completo</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Presentación del curso</li>
                <li>Unidad 1, 2, 3... automático</li>
                <li>Módulo de Evaluación</li>
                <li>Descarga masiva</li>
                <li>Consistencia visual</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Tecnología</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Next.js 15 + TypeScript</li>
                <li>Tailwind CSS + Shadcn/UI</li>
                <li>Canvas API + Sharp</li>
                <li>React Hook Form + Zod</li>
                <li>API de generación masiva</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
            <p>Generador de Miniaturas para Moodle v2.0 - con generación de conjuntos completos ❤️</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
