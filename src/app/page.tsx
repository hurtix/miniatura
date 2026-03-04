'use client';

import { useState } from 'react';
import { PresetManager } from '@/components/preset/PresetManager';
import { ThumbnailPreview } from '@/components/thumbnail/ThumbnailPreview';
import { CourseSetForm } from '@/components/course/CourseSetForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import initialPresets from '@/config/presets.json';
import type { ThumbnailConfig, GenerateSetResponse } from '@/types/thumbnail';

export default function Home() {
  const [config, setConfig] = useState<ThumbnailConfig>((initialPresets as any)[0].config);
  const [activeTab, setActiveTab] = useState('presets');

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
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Generador de Miniaturas para Moodle
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="presets" className="flex items-center gap-2">
              Gestor de Presets
            </TabsTrigger>
            <TabsTrigger value="course-set" className="flex items-center gap-2">
              Conjunto Completo de Curso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className='max-w-7xl mx-auto'>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Panel de Gestión de Presets */}
              <div className="space-y-6">
                <Card>
                  <CardContent>
                    <PresetManager
                      config={config}
                      onChange={handleConfigChange}
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
            <div className="max-w-7xl mx-auto">
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
        <footer>        
          <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
            <p>Generador de Miniaturas para Moodle &copy; UNICAUCA {new Date().getFullYear()}</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
