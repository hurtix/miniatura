'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Course {
  id: number;
  fullname: string;
  shortname: string;
  categoryname: string;
  label: string;
  value: string;
}

interface CourseComboboxProps {
  value?: string;
  onSelect: (course: Course | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface SearchResponse {
  success: boolean;
  courses: Course[];
  count: number;
  searchTerm: string;
}

export function CourseCombobox({ 
  value, 
  onSelect, 
  placeholder = 'Buscar curso...', 
  disabled = false,
  className 
}: CourseComboboxProps) {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Cargar cursos iniciales cuando abre el combobox
  useEffect(() => {
    if (open && courses.length === 0) {
      loadCourses('');
    }
  }, [open]);

  // Buscar cursos con debounce
  useEffect(() => {
    if (!open) return;

    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadCourses(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, open]);

  const loadCourses = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/moodle/search-courses?q=${encodeURIComponent(query)}&limit=25`);
      
      if (!response.ok) {
        throw new Error('Error al buscar cursos');
      }

      const data: SearchResponse = await response.json();
      
      if (data.success) {
        setCourses(data.courses);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (course: Course) => {
    setSelectedCourse(course);
    setOpen(false);
    onSelect(course);
  };

  const handleClear = () => {
    setSelectedCourse(null);
    onSelect(null);
  };

  // Encontrar el curso seleccionado si tenemos un value
  const displayCourse = selectedCourse || (value ? courses.find(c => c.value === value) : null);

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between text-left font-normal',
              !displayCourse && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="h-4 w-4 flex-shrink-0" />
              {displayCourse ? (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate font-medium">{displayCourse.fullname}</span>
                  {displayCourse.shortname !== displayCourse.fullname && (
                    <span className="text-xs text-muted-foreground truncate">
                      {displayCourse.shortname} • {displayCourse.categoryname}
                    </span>
                  )}
                </div>
              ) : (
                <span className="truncate">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {displayCourse && (
                <div
                  className="h-4 w-4 flex items-center justify-center cursor-pointer rounded-sm bg-muted hover:bg-destructive hover:text-destructive-foreground text-muted-foreground hover:text-white text-xs font-bold select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClear();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClear();
                    }
                  }}
                >
                  ×
                </div>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Buscar por nombre del curso..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Buscando cursos...
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    {searchTerm.trim() 
                      ? 'No se encontraron cursos que coincidan con la búsqueda.'
                      : 'Escribe para buscar cursos.'
                    }
                  </div>
                )}
              </CommandEmpty>
              {courses.length > 0 && (
                <CommandGroup>
                  {courses.map((course) => (
                    <CommandItem
                      key={course.id}
                      value={course.label}
                      onSelect={() => handleSelect(course)}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Check
                          className={cn(
                            'h-4 w-4 flex-shrink-0',
                            displayCourse?.id === course.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate font-medium text-sm">{course.fullname}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{course.shortname}</span>
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              {course.categoryname}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isLoading && (
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}