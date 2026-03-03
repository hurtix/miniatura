'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { ColorPicker } from '@/components/ui/color-picker';
import { ThumbnailConfig } from '@/types/thumbnail';
import { DEFAULT_PRESETS } from '@/config/presets';

const configSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  subtitle: z.string().min(1, 'El subtítulo es requerido'),
  backgroundImage: z.string().nullable().optional(),
  backgroundOpacity: z.number().min(0).max(1).optional(),
  overlayColor: z.string(),
  overlayOpacity: z.number().min(0).max(1),
  titleColor: z.string(),
  titleSize: z.number().min(12).max(120),
  titleWeight: z.number(),
  subtitleColor: z.string(),
  subtitleSize: z.number().min(10).max(80),
  subtitleWeight: z.number(),
});

type ConfigForm = z.infer<typeof configSchema>;

interface ThumbnailFormProps {
  config: ThumbnailConfig;
  onChange: (config: ThumbnailConfig) => void;
  onPresetSelect: (presetId: string) => void;
}

export function ThumbnailForm({ config, onChange, onPresetSelect }: ThumbnailFormProps) {
  const form = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      title: config.title,
      subtitle: config.subtitle,
      backgroundImage: config.backgroundImage,
      backgroundOpacity: config.backgroundOpacity || 1,
      overlayColor: config.overlayColor,
      overlayOpacity: config.overlayOpacity,
      titleColor: config.titleColor,
      titleSize: config.titleSize,
      titleWeight: config.titleWeight,
      subtitleColor: config.subtitleColor,
      subtitleSize: config.subtitleSize,
      subtitleWeight: config.subtitleWeight,
    },
  });

  const handleFieldChange = (field: keyof ConfigForm, value: any) => {
    form.setValue(field, value);
    const newConfig = { ...config, [field]: value };
    onChange(newConfig);
  };

  const handlePositionChange = (type: 'title' | 'subtitle', axis: 'x' | 'y', value: number) => {
    const positionKey = `${type}Position` as keyof ThumbnailConfig;
    const currentPosition = config[positionKey] as any;
    const newPosition = { ...currentPosition, [axis]: value };
    const newConfig = { ...config, [positionKey]: newPosition };
    onChange(newConfig);
  };

  const handleAlignChange = (type: 'title' | 'subtitle', align: 'left' | 'center' | 'right') => {
    const positionKey = `${type}Position` as keyof ThumbnailConfig;
    const currentPosition = config[positionKey] as any;
    const newPosition = { ...currentPosition, align };
    const newConfig = { ...config, [positionKey]: newPosition };
    onChange(newConfig);
  };

  return (
    <div className="space-y-6">
      {/* Selector de Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Presets Predefinidos</CardTitle>
          <CardDescription>
            Selecciona una plantilla base para empezar rápidamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEFAULT_PRESETS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => onPresetSelect(preset.id)}
                className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="space-y-2">
                  <h3 className="font-semibold">{preset.name}</h3>
                  <p className="text-sm text-muted-foreground">{preset.description}</p>
                  <div className="flex gap-2">
                    <Badge 
                      variant="secondary" 
                      style={{ backgroundColor: preset.config.overlayColor, color: 'white' }}
                      className="text-xs"
                    >
                      Color principal
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Formulario de Configuración */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="design">Diseño</TabsTrigger>
          <TabsTrigger value="text">Texto</TabsTrigger>
          <TabsTrigger value="position">Posición</TabsTrigger>
        </TabsList>

        {/* Contenido */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Contenido de la Miniatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={config.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Escribe el título del curso"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Textarea
                  id="subtitle"
                  value={config.subtitle}
                  onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                  placeholder="Descripción breve del curso"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diseño */}
        <TabsContent value="design">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Visual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Imagen de Fondo</Label>
                  <Select 
                    value={config.backgroundImage || 'none'}
                    onValueChange={(value) => handleFieldChange('backgroundImage', value === 'none' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar imagen de fondo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin imagen de fondo</SelectItem>
                      <SelectItem value="/backgrounds/corporate-bg.jpg">Corporativa</SelectItem>
                      <SelectItem value="/backgrounds/academic-bg.jpg">Académica</SelectItem>
                      <SelectItem value="/backgrounds/modern-bg.jpg">Moderna</SelectItem>
                      <SelectItem value="/backgrounds/tech-bg.jpg">Tecnológica</SelectItem>
                      <SelectItem value="/backgrounds/nature-bg.jpg">Naturaleza</SelectItem>
                      <SelectItem value="/backgrounds/abstract-bg.jpg">Abstracta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.backgroundImage && (
                  <div className="space-y-2">
                    <Label>Opacidad de Imagen: {Math.round((config.backgroundOpacity || 1) * 100)}%</Label>
                    <Slider
                      value={[config.backgroundOpacity || 1]}
                      onValueChange={(values) => handleFieldChange('backgroundOpacity', values[0])}
                      max={1}
                      min={0}
                      step={0.05}
                      className="py-4"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Color de Overlay</Label>
                  <ColorPicker
                    color={config.overlayColor}
                    onChange={(color) => handleFieldChange('overlayColor', color)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Opacidad del Overlay: {Math.round(config.overlayOpacity * 100)}%</Label>
                  <Slider
                    value={[config.overlayOpacity]}
                    onValueChange={(values) => handleFieldChange('overlayOpacity', values[0])}
                    max={1}
                    min={0}
                    step={0.05}
                    className="py-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Texto */}
        <TabsContent value="text">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Configuración del Título */}
            <Card>
              <CardHeader>
                <CardTitle>Título</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Color del Título</Label>
                  <ColorPicker
                    color={config.titleColor}
                    onChange={(color) => handleFieldChange('titleColor', color)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tamaño: {config.titleSize}px</Label>
                  <Slider
                    value={[config.titleSize]}
                    onValueChange={(values) => handleFieldChange('titleSize', values[0])}
                    max={120}
                    min={12}
                    step={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Peso de la Fuente</Label>
                  <Select 
                    value={config.titleWeight.toString()}
                    onValueChange={(value) => handleFieldChange('titleWeight', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">300 - Light</SelectItem>
                      <SelectItem value="400">400 - Regular</SelectItem>
                      <SelectItem value="500">500 - Medium</SelectItem>
                      <SelectItem value="600">600 - Semibold</SelectItem>
                      <SelectItem value="700">700 - Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Configuración del Subtítulo */}
            <Card>
              <CardHeader>
                <CardTitle>Subtítulo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Color del Subtítulo</Label>
                  <ColorPicker
                    color={config.subtitleColor}
                    onChange={(color) => handleFieldChange('subtitleColor', color)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tamaño: {config.subtitleSize}px</Label>
                  <Slider
                    value={[config.subtitleSize]}
                    onValueChange={(values) => handleFieldChange('subtitleSize', values[0])}
                    max={80}
                    min={10}
                    step={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Peso de la Fuente</Label>
                  <Select 
                    value={config.subtitleWeight.toString()}
                    onValueChange={(value) => handleFieldChange('subtitleWeight', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">300 - Light</SelectItem>
                      <SelectItem value="400">400 - Regular</SelectItem>
                      <SelectItem value="500">500 - Medium</SelectItem>
                      <SelectItem value="600">600 - Semibold</SelectItem>
                      <SelectItem value="700">700 - Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Posición */}
        <TabsContent value="position">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Posición del Título */}
            <Card>
              <CardHeader>
                <CardTitle>Posición del Título</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Posición X: {config.titlePosition.x}%</Label>
                  <Slider
                    value={[config.titlePosition.x]}
                    onValueChange={(values) => handlePositionChange('title', 'x', values[0])}
                    max={100}
                    min={0}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Posición Y: {config.titlePosition.y}%</Label>
                  <Slider
                    value={[config.titlePosition.y]}
                    onValueChange={(values) => handlePositionChange('title', 'y', values[0])}
                    max={100}
                    min={0}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alineación</Label>
                  <Select 
                    value={config.titlePosition.align}
                    onValueChange={(value: 'left' | 'center' | 'right') => handleAlignChange('title', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Izquierda</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="right">Derecha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Posición del Subtítulo */}
            <Card>
              <CardHeader>
                <CardTitle>Posición del Subtítulo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Posición X: {config.subtitlePosition.x}%</Label>
                  <Slider
                    value={[config.subtitlePosition.x]}
                    onValueChange={(values) => handlePositionChange('subtitle', 'x', values[0])}
                    max={100}
                    min={0}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Posición Y: {config.subtitlePosition.y}%</Label>
                  <Slider
                    value={[config.subtitlePosition.y]}
                    onValueChange={(values) => handlePositionChange('subtitle', 'y', values[0])}
                    max={100}
                    min={0}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alineación</Label>
                  <Select 
                    value={config.subtitlePosition.align}
                    onValueChange={(value: 'left' | 'center' | 'right') => handleAlignChange('subtitle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Izquierda</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="right">Derecha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}