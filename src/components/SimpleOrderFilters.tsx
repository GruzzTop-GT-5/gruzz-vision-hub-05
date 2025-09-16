import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface OrderFilters {
  search: string;
  status: string;
  category: string;
  priority: string;
  role: string;
  priceMin: string;
  priceMax: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SimpleOrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onClearFilters: () => void;
}

const ORDER_CATEGORIES = [
  'Грузчики',
  'Разнорабочие',
  'Квартирный переезд',
  'Офисный переезд',
  'Погрузка/разгрузка',
  'Сборка мебели',
  'Уборка',
  'Ремонтные работы',
  'Строительные работы',
  'Другое'
];

const ORDER_STATUSES = [
  { value: 'pending', label: 'Ожидает' },
  { value: 'accepted', label: 'Принят' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'review', label: 'На проверке' },
  { value: 'completed', label: 'Завершен' },
  { value: 'cancelled', label: 'Отменен' }
];

export const SimpleOrderFilters = ({ filters, onFiltersChange, onClearFilters }: SimpleOrderFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof OrderFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'sortBy' && value === 'created_at') return false;
    if (key === 'sortOrder' && value === 'desc') return false;
    if (key === 'role' && value === 'all') return false;
    return value !== '' && value !== 'all';
  });

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'sortBy' && value === 'created_at') return false;
      if (key === 'sortOrder' && value === 'desc') return false;
      if (key === 'role' && value === 'all') return false;
      return value !== '' && value !== 'all';
    }).length;
  };

  return (
    <Card className="card-steel p-4 space-y-4">
      {/* Simple Search Row */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-steel-400" />
          <Input
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Поиск заказов..."
            className="pl-10"
          />
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="shrink-0"
          >
            <X className="w-4 h-4 mr-2" />
            Сбросить
            <Badge className="ml-2 bg-primary/20 text-primary border-primary/20">
              {getActiveFiltersCount()}
            </Badge>
          </Button>
        )}
      </div>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Status Quick Filter */}
        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-auto min-w-[140px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent className="bg-steel-800 border-steel-600">
            <SelectItem value="all">Все статусы</SelectItem>
            {ORDER_STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Quick Filter */}
        <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
          <SelectTrigger className="w-auto min-w-[140px]">
            <SelectValue placeholder="Тип работы" />
          </SelectTrigger>
          <SelectContent className="bg-steel-800 border-steel-600">
            <SelectItem value="all">Все типы</SelectItem>
            {ORDER_CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Role Quick Filter */}
        <Select value={filters.role} onValueChange={(value) => updateFilter('role', value)}>
          <SelectTrigger className="w-auto min-w-[140px]">
            <SelectValue placeholder="Моя роль" />
          </SelectTrigger>
          <SelectContent className="bg-steel-800 border-steel-600">
            <SelectItem value="all">Все заказы</SelectItem>
            <SelectItem value="client">Я заказчик</SelectItem>
            <SelectItem value="executor">Я исполнитель</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Filter className="w-4 h-4 mr-2" />
              Дополнительно
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-steel-800/30 rounded-lg">
              {/* Priority */}
              <div>
                <label className="text-sm text-steel-300 mb-2 block">Приоритет</label>
                <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Любой" />
                  </SelectTrigger>
                  <SelectContent className="bg-steel-800 border-steel-600">
                    <SelectItem value="all">Любой приоритет</SelectItem>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="normal">Обычный</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="urgent">Срочный</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm text-steel-300 mb-2 block">Цена от (₽)</label>
                <Input
                  type="number"
                  value={filters.priceMin}
                  onChange={(e) => updateFilter('priceMin', e.target.value)}
                  placeholder="Минимум"
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm text-steel-300 mb-2 block">Цена до (₽)</label>
                <Input
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => updateFilter('priceMax', e.target.value)}
                  placeholder="Максимум"
                  min="0"
                />
              </div>

              {/* Sorting */}
              <div>
                <label className="text-sm text-steel-300 mb-2 block">Сортировка</label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-steel-800 border-steel-600">
                    <SelectItem value="created_at">По дате создания</SelectItem>
                    <SelectItem value="updated_at">По дате обновления</SelectItem>
                    <SelectItem value="deadline">По сроку выполнения</SelectItem>
                    <SelectItem value="price">По цене</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-steel-300 mb-2 block">Порядок</label>
                <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-steel-800 border-steel-600">
                    <SelectItem value="desc">Сначала новые</SelectItem>
                    <SelectItem value="asc">Сначала старые</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
};