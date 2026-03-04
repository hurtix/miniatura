'use client';

import React, { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { ColorPicker } from '@/components/ui/color-picker';
import { ImageSelector } from '@/components/ui/image-selector';
import { ThumbnailConfig, ThumbnailPreset } from '@/types/thumbnail';
import initialPresets from '@/config/presets.json';
import { Edit2, Trash2 } from 'lucide-react';

// Esquemas de validación
const presetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(50, 'Máximo 50 caracteres'),
  description: z.string().optional(),
});

const configSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  subtitle: z.string().min(1, 'El subtítulo es requerido'),
  backgroundImage: z.string().nullable().optional(),
  overlayColor: z.string(),
  overlayOpacity: z.number().min(0).max(1),
  titleColor: z.string(),
  titleSize: z.number().min(12).max(120),
  titleWeight: z.number(),
  subtitleColor: z.string(),
  subtitleSize: z.number().min(10).max(80),
  subtitleWeight: z.number(),
  titlePosition: z.object({
    y: z.number(),
    align: z.enum(['left', 'center', 'right'])
  }),
  titleBackground: z.string(),
  titleBackgroundOpacity: z.number().min(0).max(1),
  subtitleBackground: z.string(),
});

type PresetForm = z.infer<typeof presetSchema>;
type ConfigForm = z.infer<typeof configSchema>;

interface PresetManagerProps {
  config: ThumbnailConfig;
  onChange: (config: ThumbnailConfig) => void;
}

export function PresetManager({ config, onChange }: PresetManagerProps) {
  // Estados
  const [presets, setPresets] = useState<ThumbnailPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ThumbnailPreset | null>(null);
  const [editingPreset, setEditingPreset] = useState<ThumbnailPreset | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Formularios
  const presetForm = useForm<PresetForm>({
    resolver: zodResolver(presetSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const configForm = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      title: config.title,
      subtitle: config.subtitle,
      backgroundImage: config.backgroundImage,
      overlayColor: config.overlayColor,
      overlayOpacity: config.overlayOpacity,
      titleColor: config.titleColor,
      titleSize: config.titleSize,
      titleWeight: config.titleWeight,
      subtitleColor: config.subtitleColor,
      subtitleSize: config.subtitleSize,
      subtitleWeight: config.subtitleWeight,
      titlePosition: config.titlePosition,
      titleBackground: config.titleBackground,
      titleBackgroundOpacity: config.titleBackgroundOpacity,
      subtitleBackground: config.subtitleBackground,
    },
  });

  // Cargar presets desde localStorage o usar los iniciales
  useEffect(() => {
    const savedPresets = localStorage.getItem('allPresets');
    if (savedPresets) {
      try {
        const allPresets = JSON.parse(savedPresets);
        setPresets(allPresets);
      } catch (error) {
        console.error('Error loading presets:', error);
        // Si hay error, usar presets iniciales pero no sobrescribir localStorage
        setPresets(initialPresets as ThumbnailPreset[]);
      }
    } else {
      // Primera vez, inicializar con presets por defecto
      const initialPresetsArray = initialPresets as ThumbnailPreset[];
      setPresets(initialPresetsArray);
      localStorage.setItem('allPresets', JSON.stringify(initialPresetsArray));
    }
  }, []);

  // Guardar todos los presets en localStorage
  const saveAllPresets = (updatedPresets: ThumbnailPreset[]) => {
    localStorage.setItem('allPresets', JSON.stringify(updatedPresets));
  };

  // Seleccionar preset
  const handlePresetSelect = (preset: ThumbnailPreset) => {
    setSelectedPreset(preset);
    onChange(preset.config);
    
    // Actualizar formulario de configuración
    configForm.reset({
      title: preset.config.title,
      subtitle: preset.config.subtitle,
      backgroundImage: preset.config.backgroundImage,
      overlayColor: preset.config.overlayColor,
      overlayOpacity: preset.config.overlayOpacity,
      titleColor: preset.config.titleColor,
      titleSize: preset.config.titleSize,
      titleWeight: preset.config.titleWeight,
      subtitleColor: preset.config.subtitleColor,
      subtitleSize: preset.config.subtitleSize,
      subtitleWeight: preset.config.subtitleWeight,
      titlePosition: preset.config.titlePosition,
      titleBackground: preset.config.titleBackground,
      titleBackgroundOpacity: preset.config.titleBackgroundOpacity,
      subtitleBackground: preset.config.subtitleBackground,
    });
  };

  // Actualizar configuración del preset seleccionado
  const handleConfigChange = (newConfig: ThumbnailConfig) => {
    if (!selectedPreset) return;
    
    // Actualizar el preset en la lista
    const updatedPresets = presets.map(preset => 
      preset.id === selectedPreset.id 
        ? { ...preset, config: newConfig }
        : preset
    );
    
    setPresets(updatedPresets);
    saveAllPresets(updatedPresets);
    
    // Actualizar el preset seleccionado
    setSelectedPreset({ ...selectedPreset, config: newConfig });
    
    // Llamar al onChange del componente padre
    onChange(newConfig);
  };

  // Función para sanitizar nombre y generar ID
  const generatePresetId = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno solo
      .replace(/^-+|-+$/g, ''); // Quitar guiones al inicio y final
  };

  // Crear nuevo preset
  const handleCreatePreset = (data: PresetForm) => {
    const generatedId = generatePresetId(data.name);
    
    // Verificar si el ID ya existe
    const existingPreset = presets.find(p => p.id === generatedId);
    if (existingPreset) {
      alert('Ya existe un preset con ese nombre. Por favor, elige un nombre diferente.');
      return;
    }

    const newPreset: ThumbnailPreset = {
      id: generatedId,
      name: data.name,
      description: data.description || '',
      config: { ...config }, // Usar configuración actual
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    saveAllPresets(updatedPresets);
    
    presetForm.reset();
    setIsCreateDialogOpen(false);
  };

  // Editar preset existente
  const handleEditPreset = (data: PresetForm) => {
    if (!editingPreset) return;

    const updatedPresets = presets.map(preset => 
      preset.id === editingPreset.id 
        ? {
            ...preset,
            name: data.name,
            description: data.description || '',
            config: { ...config }, // Actualizar con configuración actual
          }
        : preset
    );

    setPresets(updatedPresets);
    saveAllPresets(updatedPresets);
    
    setEditingPreset(null);
    setIsEditDialogOpen(false);
    presetForm.reset();
  };

  // Eliminar preset
  const handleDeletePreset = (presetId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este preset?')) {
      const updatedPresets = presets.filter(preset => preset.id !== presetId);
      setPresets(updatedPresets);
      saveAllPresets(updatedPresets);

      // Si estaba seleccionado el preset eliminado, deseleccionar
      if (selectedPreset?.id === presetId) {
        setSelectedPreset(null);
      }
    }
  };

  // Abrir diálogo de edición
  const handleOpenEditDialog = (preset: ThumbnailPreset) => {
    setEditingPreset(preset);
    presetForm.reset({
      name: preset.name,
      description: preset.description || '',
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header con actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gestor de Presets</h2>
          <p className="text-sm text-muted-foreground">
            Crea, edita y gestiona presets personalizados para tus miniaturas
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
            >
              Nuevo Preset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Preset</DialogTitle>
              <DialogDescription>
                Define un nuevo preset basado en la configuración actual
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={presetForm.handleSubmit(handleCreatePreset)} className="space-y-4">
              <div>
                <Label htmlFor="preset-name">Nombre</Label>
                <Input
                  id="preset-name"
                  {...presetForm.register('name')}
                  placeholder="ej: Mi Preset Personalizado"
                />
                {presetForm.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {presetForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="preset-description">Descripción (opcional)</Label>
                <Textarea
                  id="preset-description"
                  {...presetForm.register('description')}
                  placeholder="Describe las características de este preset (opcional)"
                />
                {presetForm.formState.errors.description && (
                  <p className="text-sm text-destructive mt-1">
                    {presetForm.formState.errors.description.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">Crear Preset</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de presets */}
      <Card>
        <CardHeader>
          <CardTitle>Presets Disponibles</CardTitle>
          <CardDescription>
            Selecciona un preset para aplicarlo. Todos los presets se pueden editar y eliminar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {presets.map((preset) => {
              const isSelected = selectedPreset?.id === preset.id;
              
              return (
                <div
                  key={preset.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{preset.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {preset.description || 'Sin descripción'}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="icon-xs"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditDialog(preset);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Badge 
                        variant="outline"
                        style={{ 
                          backgroundColor: preset.config.overlayColor, 
                          color: 'white',
                          borderColor: preset.config.overlayColor
                        }}
                        className="text-xs"
                      >
                        {preset.config.overlayColor}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Opciones de configuración cuando hay un preset seleccionado */}
      {selectedPreset && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Preset: {selectedPreset.name}</CardTitle>
            <CardDescription>
              Modifica los parámetros del preset seleccionado. Los cambios se guardan automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="design">Diseño</TabsTrigger>
                <TabsTrigger value="typography">Tipografía</TabsTrigger>
              </TabsList>

              {/* Contenido */}
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={config.title}
                    onChange={(e) => {
                      const newConfig = { ...config, title: e.target.value };
                      handleConfigChange(newConfig);
                    }}
                    placeholder="Título principal del curso"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtítulo</Label>
                  <Textarea
                    id="subtitle"
                    value={config.subtitle}
                    onChange={(e) => {
                      const newConfig = { ...config, subtitle: e.target.value };
                      handleConfigChange(newConfig);
                    }}
                    placeholder="Descripción breve del curso"
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Diseño */}
              <TabsContent value="design" className="space-y-4">
                <ImageSelector
                  value={config.backgroundImage}
                  onChange={(imageUrl) => {
                    const newConfig = { ...config, backgroundImage: imageUrl };
                    handleConfigChange(newConfig);
                  }}
                />

                <div className="space-y-2">
                  <Label>Color de Overlay</Label>
                  <ColorPicker
                    color={config.overlayColor}
                    onChange={(color) => {
                      const newConfig = { ...config, overlayColor: color };
                      handleConfigChange(newConfig);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Opacidad del Overlay: {Math.round(config.overlayOpacity * 100)}%</Label>
                  <Slider
                    value={[config.overlayOpacity]}
                    onValueChange={([value]) => {
                      const newConfig = { ...config, overlayOpacity: value };
                      handleConfigChange(newConfig);
                    }}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Posición Vertical del Texto: {config.titlePosition.y}%</Label>
                  <Slider
                    value={[config.titlePosition.y]}
                    onValueChange={([value]) => {
                      const newConfig = { 
                        ...config, 
                        titlePosition: { ...config.titlePosition, y: value }
                      };
                      handleConfigChange(newConfig);
                    }}
                    max={80}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alineación del Texto</Label>
                  <Select 
                    value={config.titlePosition.align}
                    onValueChange={(value: 'left' | 'center' | 'right') => {
                      const newConfig = { 
                        ...config, 
                        titlePosition: { ...config.titlePosition, align: value }
                      };
                      handleConfigChange(newConfig);
                    }}
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

                <div className="space-y-2">
                  <Label>Color de Fondo del Texto</Label>
                  <ColorPicker
                    color={config.titleBackground}
                    onChange={(color) => {
                      const newConfig = { ...config, titleBackground: color };
                      handleConfigChange(newConfig);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Opacidad del Fondo del Texto: {Math.round(config.titleBackgroundOpacity * 100)}%</Label>
                  <Slider
                    value={[config.titleBackgroundOpacity]}
                    onValueChange={([value]) => {
                      const newConfig = { ...config, titleBackgroundOpacity: value };
                      handleConfigChange(newConfig);
                    }}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </TabsContent>

              {/* Tipografía */}
              <TabsContent value="typography" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Título</h4>
                    
                    <div className="space-y-2">
                      <Label>Color del Título</Label>
                      <ColorPicker
                        color={config.titleColor}
                        onChange={(color) => {
                          const newConfig = { ...config, titleColor: color };
                          handleConfigChange(newConfig);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tamaño del Título: {config.titleSize}px</Label>
                      <Slider
                        value={[config.titleSize]}
                        onValueChange={([value]) => {
                          const newConfig = { ...config, titleSize: value };
                          handleConfigChange(newConfig);
                        }}
                        max={120}
                        min={12}
                        step={2}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Peso del Título</Label>
                      <Select 
                        value={config.titleWeight.toString()}
                        onValueChange={(value) => {
                          const newConfig = { ...config, titleWeight: parseInt(value) as 300 | 400 | 500 | 600 | 700 };
                          handleConfigChange(newConfig);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="300">Ligero (300)</SelectItem>
                          <SelectItem value="400">Normal (400)</SelectItem>
                          <SelectItem value="500">Medio (500)</SelectItem>
                          <SelectItem value="600">Semi-negrita (600)</SelectItem>
                          <SelectItem value="700">Negrita (700)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Subtítulo</h4>
                    
                    <div className="space-y-2">
                      <Label>Color del Subtítulo</Label>
                      <ColorPicker
                        color={config.subtitleColor}
                        onChange={(color) => {
                          const newConfig = { ...config, subtitleColor: color };
                          handleConfigChange(newConfig);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tamaño del Subtítulo: {config.subtitleSize}px</Label>
                      <Slider
                        value={[config.subtitleSize]}
                        onValueChange={([value]) => {
                          const newConfig = { ...config, subtitleSize: value };
                          handleConfigChange(newConfig);
                        }}
                        max={80}
                        min={10}
                        step={2}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Peso del Subtítulo</Label>
                      <Select 
                        value={config.subtitleWeight.toString()}
                        onValueChange={(value) => {
                          const newConfig = { ...config, subtitleWeight: parseInt(value) as 300 | 400 | 500 | 600 | 700 };
                          handleConfigChange(newConfig);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="300">Ligero (300)</SelectItem>
                          <SelectItem value="400">Normal (400)</SelectItem>
                          <SelectItem value="500">Medio (500)</SelectItem>
                          <SelectItem value="600">Semi-negrita (600)</SelectItem>
                          <SelectItem value="700">Negrita (700)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Preset</DialogTitle>
            <DialogDescription>
              Modifica las propiedades de este preset
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={presetForm.handleSubmit(handleEditPreset)} className="space-y-4">
            <div>
              <Label htmlFor="edit-preset-name">Nombre</Label>
              <Input
                id="edit-preset-name"
                {...presetForm.register('name')}
                placeholder="ej: Mi Preset Personalizado"
              />
              {presetForm.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {presetForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-preset-description">Descripción (opcional)</Label>
              <Textarea
                id="edit-preset-description"
                {...presetForm.register('description')}
                placeholder="Describe las características de este preset"
              />
              {presetForm.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {presetForm.formState.errors.description.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}