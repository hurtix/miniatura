'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Check } from 'lucide-react';

interface ImageOption {
  id: string;
  name: string;
  url: string;
  isDefault?: boolean;
}

interface ImageSelectorProps {
  value: string | null;
  onChange: (imageUrl: string | null) => void;
  className?: string;
}

const DEFAULT_IMAGES: ImageOption[] = [
  { id: 'ia', name: 'IA', url: '/backgrounds/ia.jpg', isDefault: true },
];

export function ImageSelector({ value, onChange, className = '' }: ImageSelectorProps) {
  const [customImages, setCustomImages] = useState<ImageOption[]>([]);
  const [uploadMessage, setUploadMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar imágenes personalizadas desde localStorage
  useEffect(() => {
    const savedImages = localStorage.getItem('customBackgroundImages');
    if (savedImages) {
      try {
        const images = JSON.parse(savedImages);
        setCustomImages(images);
      } catch (error) {
        console.error('Error loading custom images:', error);
      }
    }
  }, []);

  // Guardar imágenes personalizadas en localStorage
  const saveCustomImages = (images: ImageOption[]) => {
    localStorage.setItem('customBackgroundImages', JSON.stringify(images));
    setCustomImages(images);
  };

  const allImages = [...DEFAULT_IMAGES, ...customImages];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadMessage(null);

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setUploadMessage({ text: 'Por favor selecciona un archivo de imagen válido', type: 'error' });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage({ text: 'La imagen debe ser menor a 5MB', type: 'error' });
      return;
    }

    // Crear objeto URL para preview
    const imageUrl = URL.createObjectURL(file);
    
    // Validar dimensiones
    const img = new Image();
    img.onload = () => {
      if (img.width !== 600 || img.height !== 420) {
        setUploadMessage({ 
          text: `Dimensiones incorrectas: ${img.width}x${img.height}. Requerido: 600x420`, 
          type: 'error' 
        });
        URL.revokeObjectURL(imageUrl);
        return;
      }

      // Crear data URL para guardar
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 600;
      canvas.height = 420;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, 600, 420);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Agregar imagen personalizada
        const customImage: ImageOption = {
          id: `custom-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''), // Quitar extensión
          url: dataUrl,
          isDefault: false
        };

        setCustomImages(prev => {
          const newImages = [...prev, customImage];
          saveCustomImages(newImages);
          return newImages;
        });
        onChange(dataUrl);
        setUploadMessage({ text: 'Imagen cargada correctamente', type: 'success' });
      }
      
      URL.revokeObjectURL(imageUrl);
    };
    
    img.onerror = () => {
      setUploadMessage({ text: 'Error al procesar la imagen', type: 'error' });
      URL.revokeObjectURL(imageUrl);
    };
    
    img.src = imageUrl;
  };

  const handleRemoveCustomImage = (imageId: string) => {
    const newImages = customImages.filter(img => img.id !== imageId);
    saveCustomImages(newImages);
    if (value && customImages.find(img => img.id === imageId && img.url === value)) {
      onChange(null);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label>Imagen de Fondo</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Subir Imagen
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {uploadMessage && (
        <div className={`text-sm p-2 rounded ${
          uploadMessage.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {uploadMessage.text}
        </div>
      )}

      <div className="text-xs text-muted-foreground mb-4">
        Dimensiones requeridas: 600x420 píxeles • Máximo 5MB
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
        {/* Opción sin imagen */}
        <Card 
          className={`cursor-pointer transition-all hover:scale-105 ${
            !value ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
          }`}
          onClick={() => onChange(null)}
        >
          <CardContent className="p-2">
            <div className="aspect-[600/420] bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-xs text-gray-500">Sin imagen</span>
            </div>
          </CardContent>
        </Card>

        {/* Imágenes disponibles */}
        {allImages.map((image) => (
          <Card 
            key={image.id}
            className={`cursor-pointer transition-all hover:scale-105 ${
              value === image.url ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
            }`}
            onClick={() => onChange(image.url)}
          >
            <CardContent className="p-2">
              <div className="relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className="aspect-[600/420] object-cover rounded w-full"
                  onError={(e) => {
                    // Ocultar imagen si falla la carga en lugar de mostrar placeholder
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                {!image.isDefault && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 w-6 h-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCustomImage(image.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}