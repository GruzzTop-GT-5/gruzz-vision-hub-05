import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CalendarDays, Clock, MapPin, Truck } from 'lucide-react';

interface CreateGarbageRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNeedsWorkers?: () => void;
}

const wasteTypes = [
  { value: 'construction', label: 'Строительный мусор', basePrice: 3000 },
  { value: 'household', label: 'Бытовой мусор', basePrice: 2000 },
  { value: 'large', label: 'Крупногабаритный мусор', basePrice: 2500 }
];

const volumeOptions = [
  { value: 'container_1-2', label: '1-2 контейнера', multiplier: 1 },
  { value: 'gazelle_1', label: '1 Газель', multiplier: 1.5 },
  { value: 'kamaz_1', label: '1 КАМАЗ', multiplier: 3 },
  { value: 'custom', label: 'Другой объем', multiplier: 1 }
];

export const CreateGarbageRemovalModal: React.FC<CreateGarbageRemovalModalProps> = ({
  isOpen,
  onClose,
  onNeedsWorkers
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    wasteType: '',
    volume: '',
    customVolume: '',
    needsLoading: '',
    date: '',
    time: '',
    address: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Необходима авторизация');
      return;
    }

    setLoading(true);
    
    try {
      const selectedWasteType = wasteTypes.find(type => type.value === formData.wasteType);
      const selectedVolume = volumeOptions.find(vol => vol.value === formData.volume);
      
      const basePrice = selectedWasteType?.basePrice || 2000;
      const volumeMultiplier = selectedVolume?.multiplier || 1;
      const loadingFee = formData.needsLoading === 'yes' ? 1500 : 0;
      
      const totalCost = (basePrice * volumeMultiplier) + loadingFee;

      // Получаем номер заказа с типом
      const { data: orderNumberData, error: numberError } = await supabase
        .rpc('generate_order_number_with_type', { p_service_type: 'garbage_removal' });

      if (numberError) throw numberError;

      const volumeDescription = formData.volume === 'custom' ? formData.customVolume : selectedVolume?.label;

      const { error } = await supabase.from('orders').insert({
        order_number: orderNumberData,
        title: `Вывоз мусора - ${selectedWasteType?.label}`,
        description: formData.description,
        category: 'Вывоз мусора',
        service_type: 'garbage_removal',
        waste_type: formData.wasteType,
        waste_volume: volumeDescription,
        needs_loading: formData.needsLoading === 'yes',
        price: totalCost,
        deadline: `${formData.date}T${formData.time}`,
        client_id: user.id,
        status: 'pending',
        waste_details: {
          wasteType: formData.wasteType,
          volume: volumeDescription,
          needsLoading: formData.needsLoading === 'yes',
          address: formData.address,
          date: formData.date,
          time: formData.time,
          description: formData.description
        }
      });

      if (error) throw error;

      toast.success('Заказ на вывоз мусора создан!');
      
      // Если нужна погрузка, предлагаем заказать грузчиков
      if (formData.needsLoading === 'yes' && onNeedsWorkers) {
        toast.info('Рекомендуем также заказать грузчиков для погрузки');
        setTimeout(() => {
          onNeedsWorkers();
        }, 1000);
      }
      
      onClose();
      setFormData({
        wasteType: '',
        volume: '',
        customVolume: '',
        needsLoading: '',
        date: '',
        time: '',
        address: '',
        description: ''
      });
    } catch (error) {
      console.error('Error creating garbage removal order:', error);
      toast.error('Ошибка при создании заказа');
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = () => {
    const selectedWasteType = wasteTypes.find(type => type.value === formData.wasteType);
    const selectedVolume = volumeOptions.find(vol => vol.value === formData.volume);
    
    if (!selectedWasteType || !selectedVolume) return 0;
    
    const basePrice = selectedWasteType.basePrice;
    const volumeMultiplier = selectedVolume.multiplier;
    const loadingFee = formData.needsLoading === 'yes' ? 1500 : 0;
    
    return (basePrice * volumeMultiplier) + loadingFee;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Вывоз мусора
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="wasteType">Тип мусора</Label>
              <Select
                value={formData.wasteType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, wasteType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип мусора" />
                </SelectTrigger>
                <SelectContent>
                  {wasteTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} (от {type.basePrice.toLocaleString()}₽)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="volume">Примерный объем</Label>
              <Select
                value={formData.volume}
                onValueChange={(value) => setFormData(prev => ({ ...prev, volume: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите объем мусора" />
                </SelectTrigger>
                <SelectContent>
                  {volumeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.volume === 'custom' && (
              <div>
                <Label htmlFor="customVolume">Укажите объем</Label>
                <Input
                  id="customVolume"
                  value={formData.customVolume}
                  onChange={(e) => setFormData(prev => ({ ...prev, customVolume: e.target.value }))}
                  placeholder="Опишите объем мусора"
                  required
                />
              </div>
            )}

            <div>
              <Label>Нужна ли погрузка?</Label>
              <RadioGroup
                value={formData.needsLoading}
                onValueChange={(value) => setFormData(prev => ({ ...prev, needsLoading: value }))}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="loading-yes" />
                  <Label htmlFor="loading-yes">Да (+1,500₽)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="loading-no" />
                  <Label htmlFor="loading-no">Нет</Label>
                </div>
              </RadioGroup>
              {formData.needsLoading === 'yes' && (
                <p className="text-sm text-muted-foreground mt-2">
                  При выборе погрузки мы рекомендуем также заказать грузчиков
                </p>
              )}
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
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Адрес
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Укажите адрес вывоза мусора"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Дополнительная информация</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Опишите особенности мусора, доступ к объекту и другие детали"
                rows={3}
              />
            </div>

            {formData.wasteType && formData.volume && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h3 className="font-semibold mb-2 text-foreground">Предварительная стоимость:</h3>
                <p className="text-3xl font-bold text-primary mb-2">
                  {calculateCost().toLocaleString()} ₽
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Базовая стоимость: {wasteTypes.find(t => t.value === formData.wasteType)?.basePrice.toLocaleString()} ₽</p>
                  {formData.volume !== 'custom' && (
                    <p>• Коэффициент объёма: ×{volumeOptions.find(v => v.value === formData.volume)?.multiplier}</p>
                  )}
                  {formData.needsLoading === 'yes' && <p>• Погрузка: +1,500 ₽</p>}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Создание заказа...' : 'Заказать вывоз'}
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