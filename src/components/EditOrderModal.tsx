import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput } from '@/utils/security';
import { validateAmount, formatBalance, formatRubles } from '@/utils/currency';
import { Edit3, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const ORDER_CATEGORIES = [
  'Грузчики',
  'Разнорабочие', 
  'Квартирный переезд',
  'Офисный переезд',
  'Погрузка/разгрузка',
  'Сборка мебели',
  'Уборка помещений',
  'Строительные работы',
  'Ремонтные работы',
  'Демонтаж',
  'Подсобные работы',
  'Складские работы',
  'Курьерские услуги',
  'Садовые работы',
  'Другое'
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'normal', label: 'Обычный' },
  { value: 'high', label: 'Высокий' },
  { value: 'urgent', label: 'Срочный' }
];

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
  order: any;
}

export const EditOrderModal = ({ isOpen, onClose, onOrderUpdated, order }: EditOrderModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    priority: 'normal',
    deadline: null as Date | null,
    deliveryFormat: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when order changes
  useEffect(() => {
    if (order) {
      setFormData({
        title: order.title || '',
        description: order.description || '',
        category: order.category || '',
        price: order.price?.toString() || '',
        priority: order.priority || 'normal',
        deadline: order.deadline ? new Date(order.deadline) : null,
        deliveryFormat: order.delivery_format || ''
      });
    }
  }, [order]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      price: '',
      priority: 'normal',
      deadline: null,
      deliveryFormat: ''
    });
  };

  const handleSubmit = async () => {
    if (!user?.id || !order?.id) {
      toast({
        title: "Ошибка",
        description: "Пользователь или заказ не найден",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!formData.title.trim()) {
      toast({
        title: "Ошибка валидации",
        description: "Название заказа обязательно для заполнения",
        variant: "destructive"
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Ошибка валидации", 
        description: "Выберите категорию заказа",
        variant: "destructive"
      });
      return;
    }

    if (!formData.price || !validateAmount(parseFloat(formData.price))) {
      toast({
        title: "Ошибка валидации",
        description: "Укажите корректную цену",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(formData.price);
    if (price < 50) {
      toast({
        title: "Ошибка валидации",
        description: "Минимальная стоимость заказа: 50 GT",
        variant: "destructive"
      });
      return;
    }

    if (price > 1000000) {
      toast({
        title: "Ошибка валидации",
        description: "Максимальная стоимость заказа: 1,000,000 GT",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize inputs
      const sanitizedData = {
        title: sanitizeInput(formData.title.trim()),
        description: formData.description.trim() ? sanitizeInput(formData.description.trim()) : null,
        category: formData.category,
        price: price,
        priority: formData.priority,
        deadline: formData.deadline ? formData.deadline.toISOString() : null,
        delivery_format: formData.deliveryFormat.trim() ? sanitizeInput(formData.deliveryFormat.trim()) : null,
        updated_at: new Date().toISOString()
      };

      // Update order in database
      const { error } = await supabase
        .from('orders')
        .update(sanitizedData)
        .eq('id', order.id)
        .eq('client_id', user.id); // Ensure only the client can edit

      if (error) throw error;

      toast({
        title: "Заказ обновлен",
        description: "Ваш заказ был успешно обновлен"
      });

      resetForm();
      onClose();
      onOrderUpdated();

    } catch (error: any) {
      console.error('Error updating order:', error);
      
      let errorMessage = "Не удалось обновить заказ";
      
      if (error?.message?.includes('insufficient_privilege')) {
        errorMessage = "У вас нет прав для редактирования этого заказа";
      } else if (error?.message?.includes('row-level security')) {
        errorMessage = "Нарушение политики безопасности";
      }

      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="card-steel-dialog max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-primary" />
            <span>Редактировать заказ</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-steel-200">
              Название заказа *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Краткое и понятное название работы"
              className="bg-steel-700 border-steel-600 text-steel-100"
              maxLength={100}
              disabled={isSubmitting}
            />
            <p className="text-xs text-steel-400">
              {formData.title.length}/100 символов
            </p>
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-steel-200">
                Категория *
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-steel-700 border-steel-600 text-steel-100">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent className="bg-steel-800 border-steel-600">
                  {ORDER_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category} className="text-steel-100">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-steel-200">
                Приоритет
              </Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-steel-700 border-steel-600 text-steel-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-steel-800 border-steel-600">
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-steel-100">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-steel-200">
              Описание работы
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Подробно опишите, что нужно сделать..."
              className="bg-steel-700 border-steel-600 text-steel-100 min-h-[100px]"
              maxLength={2000}
              disabled={isSubmitting}
            />
            <p className="text-xs text-steel-400">
              {formData.description.length}/2000 символов
            </p>
          </div>

          {/* Price and Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-steel-200">
                Стоимость (GT) *
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Сумма в GT"
                className="bg-steel-700 border-steel-600 text-steel-100"
                min="50"
                max="1000000"
                step="1"
                disabled={isSubmitting}
              />
              <p className="text-xs text-steel-400">
                Минимум: 50 GT | Максимум: 1,000,000 GT
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-steel-200">
                Срок выполнения
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-steel-700 border-steel-600 text-steel-100"
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? format(formData.deadline, 'dd MMM yyyy', { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-steel-800 border-steel-600">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => setFormData(prev => ({ ...prev, deadline: date || null }))}
                    disabled={(date) => date < new Date()}
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Delivery Format */}
          <div className="space-y-2">
            <Label htmlFor="deliveryFormat" className="text-steel-200">
              Формат результата
            </Label>
            <Input
              id="deliveryFormat"
              value={formData.deliveryFormat}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryFormat: e.target.value }))}
              placeholder="Как должен быть предоставлен результат работы"
              className="bg-steel-700 border-steel-600 text-steel-100"
              maxLength={200}
              disabled={isSubmitting}
            />
          </div>


          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary/80"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Edit3 className="w-4 h-4 mr-2" />
              )}
              Сохранить изменения
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 border-steel-600 text-steel-300 hover:bg-steel-700"
            >
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};