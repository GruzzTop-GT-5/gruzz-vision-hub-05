import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit3, Trash2, Tag, Eye, EyeOff, GripVertical } from "lucide-react";
import * as Icons from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

const iconsList = [
  'Code', 'Smartphone', 'Palette', 'PenTool', 'TrendingUp', 'Languages', 
  'Video', 'MessageCircle', 'Camera', 'Music', 'BookOpen', 'Briefcase',
  'Home', 'Car', 'Heart', 'Star', 'Settings', 'Users', 'Globe', 'Zap'
];

const colorOptions = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1'
];

export function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: 'Tag',
    color: '#3B82F6',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchCategories();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('categories_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить категории",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        
        toast({
          title: "Успех",
          description: "Категория обновлена",
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Успех",
          description: "Категория создана",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить категорию",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'Tag',
      color: category.color,
      is_active: category.is_active,
      sort_order: category.sort_order
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      
      toast({
        title: "Успех",
        description: "Категория удалена",
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить категорию",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;
      
      toast({
        title: "Успех",
        description: `Категория ${!category.is_active ? 'активирована' : 'деактивирована'}`,
      });
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус категории",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Tag',
      color: '#3B82F6',
      is_active: true,
      sort_order: categories.length
    });
    setEditingCategory(null);
  };

  const renderIcon = (iconName: string, className: string = "") => {
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return <IconComponent className={className} />;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <Card className="card-steel transform-none !rotate-0 !scale-100 !skew-x-0 !skew-y-0 !translate-x-0 !translate-y-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="w-5 h-5 text-primary" />
              <span>Управление категориями</span>
            </CardTitle>
            <CardDescription>
              Создавайте и редактируйте категории для объявлений
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="btn-3d">
                <Plus className="w-4 h-4 mr-2" />
                Добавить категорию
              </Button>
            </DialogTrigger>
            <DialogContent className="card-steel-dialog max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Измените параметры категории' : 'Заполните информацию о новой категории'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Название*</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Название категории"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Описание категории"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="icon">Иконка</Label>
                    <select
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      {iconsList.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="color">Цвет</Label>
                    <div className="flex gap-2 flex-wrap">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.color === color ? 'border-white' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Активная категория</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" className="btn-3d">
                    {editingCategory ? 'Сохранить' : 'Создать'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead className="w-24">Статус</TableHead>
                  <TableHead className="w-32">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.color }}
                        >
                          {renderIcon(category.icon || 'Tag', "w-4 h-4 text-white")}
                        </div>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Порядок: {category.sort_order}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-muted-foreground">
                        {category.description || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? 'Активна' : 'Неактивна'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(category)}
                          title={category.is_active ? 'Деактивировать' : 'Активировать'}
                        >
                          {category.is_active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          title="Редактировать"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          title="Удалить"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Категории не найдены</p>
              <p className="text-sm">Создайте первую категорию для объявлений</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}