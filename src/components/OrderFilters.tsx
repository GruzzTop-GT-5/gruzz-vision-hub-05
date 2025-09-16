import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

export interface OrderFilters {
  search: string;
  status: string;
  category: string;
  priority: string;
  role: string; // 'client' | 'executor' | 'all'
  priceMin: string;
  priceMax: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface OrderFiltersProps {
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
  { value: 'revision', label: 'Доработка' },
  { value: 'completed', label: 'Завершен' },
  { value: 'cancelled', label: 'Отменен' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'normal', label: 'Обычный' },
  { value: 'high', label: 'Высокий' },
  { value: 'urgent', label: 'Срочный' }
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Дате создания' },
  { value: 'updated_at', label: 'Дате обновления' },
  { value: 'deadline', label: 'Сроку выполнения' },
  { value: 'price', label: 'Цене' },
  { value: 'priority', label: 'Приоритету' }
];

export const OrderFilters = ({ filters, onFiltersChange, onClearFilters }: OrderFiltersProps) => {
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
      {/* Search and Clear */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-steel-400" />
          <Input
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Поиск по названию, описанию или номеру заказа..."
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
            Очистить
            <Badge className="ml-2 bg-primary/20 text-primary border-primary/20">
              {getActiveFiltersCount()}
            </Badge>
          </Button>
        )}
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {/* Status Filter */}
        <div>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {ORDER_STATUSES.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div>
          <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {ORDER_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div>
          <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Приоритет" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все приоритеты</SelectItem>
              {PRIORITY_OPTIONS.map(priority => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Role Filter */}
        <div>
          <Select value={filters.role} onValueChange={(value) => updateFilter('role', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Роль" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все заказы</SelectItem>
              <SelectItem value="client">Я клиент</SelectItem>
              <SelectItem value="executor">Я исполнитель</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div>
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  По {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div>
          <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Убывание</SelectItem>
              <SelectItem value="asc">Возрастание</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Input
            type="number"
            value={filters.priceMin}
            onChange={(e) => updateFilter('priceMin', e.target.value)}
            placeholder="Цена от (GT)"
            min="0"
          />
        </div>
        <div>
          <Input
            type="number"
            value={filters.priceMax}
            onChange={(e) => updateFilter('priceMax', e.target.value)}
            placeholder="Цена до (GT)"
            min="0"
          />
        </div>
      </div>
    </Card>
  );
};