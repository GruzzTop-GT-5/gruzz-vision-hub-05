import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CalendarDays, Clock, MapPin, Wrench } from 'lucide-react';

interface CreateCompressorRentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const workTypes = [
  { value: 'demolition', label: 'Демонтаж' },
  { value: 'cleaning', label: 'Продувка' },
  { value: 'construction', label: 'Строительные работы' },
  { value: 'other', label: 'Другое' }
];

const additionalEquipment = [
  'Пневматический молоток',
  'Шланги дополнительные (10м)',
  'Насадки для продувки',
  'Защитное оборудование',
  'Удлинитель'
];

export const CreateCompressorRentModal: React.FC<CreateCompressorRentModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    workType: '',
    customWorkType: '',
    rentalDuration: '',
    date: '',
    time: '',
    address: '',
    description: '',
    selectedEquipment: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Необходима авторизация');
      return;
    }

    setLoading(true);
    
    try {
      const workTypeValue = formData.workType === 'other' ? formData.customWorkType : formData.workType;
      const hourlyRate = 1500; // 1500 руб/час базовая ставка
      const equipmentCost = formData.selectedEquipment.length * 500; // 500 руб за каждое доп. оборудование
      const totalCost = (parseFloat(formData.rentalDuration) * hourlyRate) + equipmentCost;

      // Получаем номер заказа с типом
      const { data: orderNumberData, error: numberError } = await supabase
        .rpc('generate_order_number_with_type', { p_service_type: 'compressor_rent' });

      if (numberError) throw numberError;

      const { error } = await supabase.from('orders').insert({
        order_number: orderNumberData,
        title: `Аренда компрессора - ${workTypeValue}`,
        description: formData.description,
        category: 'Аренда компрессора',
        service_type: 'compressor_rent',
        work_type: workTypeValue,
        rental_duration_hours: parseInt(formData.rentalDuration),
        additional_equipment: formData.selectedEquipment,
        price: totalCost,
        deadline: `${formData.date}T${formData.time}`,
        client_id: user.id,
        status: 'pending',
        equipment_details: {
          workType: workTypeValue,
          duration: formData.rentalDuration,
          address: formData.address,
          date: formData.date,
          time: formData.time,
          additionalEquipment: formData.selectedEquipment,
          description: formData.description
        }
      });

      if (error) throw error;

      toast.success('Заказ на аренду компрессора создан!');
      onClose();
      setFormData({
        workType: '',
        customWorkType: '',
        rentalDuration: '',
        date: '',
        time: '',
        address: '',
        description: '',
        selectedEquipment: []
      });
    } catch (error) {
      console.error('Error creating compressor rent order:', error);
      toast.error('Ошибка при создании заказа');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedEquipment: checked 
        ? [...prev.selectedEquipment, equipment]
        : prev.selectedEquipment.filter(item => item !== equipment)
    }));
  };

  const calculateCost = () => {
    const hourlyRate = 1500;
    const equipmentCost = formData.selectedEquipment.length * 500;
    const duration = parseFloat(formData.rentalDuration) || 0;
    return (duration * hourlyRate) + equipmentCost;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Аренда компрессора
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="workType">Для каких работ нужен компрессор?</Label>
              <Select
                value={formData.workType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, workType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип работ" />
                </SelectTrigger>
                <SelectContent>
                  {workTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.workType === 'other' && (
              <div>
                <Label htmlFor="customWorkType">Укажите тип работ</Label>
                <Input
                  id="customWorkType"
                  value={formData.customWorkType}
                  onChange={(e) => setFormData(prev => ({ ...prev, customWorkType: e.target.value }))}
                  placeholder="Опишите, для каких работ нужен компрессор"
                  required
                />
              </div>
            )}

            <div>
              <Label>Дополнительное оборудование</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {additionalEquipment.map((equipment) => (
                  <div key={equipment} className="flex items-center space-x-2">
                    <Checkbox
                      id={equipment}
                      checked={formData.selectedEquipment.includes(equipment)}
                      onCheckedChange={(checked) => handleEquipmentChange(equipment, checked as boolean)}
                    />
                    <Label htmlFor={equipment} className="text-sm">
                      {equipment} (+500₽)
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Дата
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Время
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="rentalDuration">На какой срок (часов)?</Label>
              <Input
                id="rentalDuration"
                type="number"
                min="1"
                max="24"
                value={formData.rentalDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, rentalDuration: e.target.value }))}
                placeholder="Количество часов аренды"
                required
              />
            </div>

            <div>
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Адрес
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Укажите адрес для доставки компрессора"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Дополнительные требования</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Опишите особые требования или детали работы"
                rows={3}
              />
            </div>

            {formData.rentalDuration && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Предварительная стоимость:</h3>
                <p className="text-2xl font-bold text-primary">
                  {calculateCost().toLocaleString()} ₽
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Аренда: {formData.rentalDuration}ч × 1,500₽ = {(parseFloat(formData.rentalDuration) * 1500).toLocaleString()}₽
                  {formData.selectedEquipment.length > 0 && (
                    <span><br/>Доп. оборудование: {formData.selectedEquipment.length} × 500₽ = {formData.selectedEquipment.length * 500}₽</span>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Создание заказа...' : 'Заказать компрессор'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};