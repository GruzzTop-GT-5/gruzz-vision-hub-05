import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CompressorRentData {
  hours: number;
  location: 'city' | 'suburb' | 'far';
  equipment: string[];
  paymentType: 'cash' | 'vat';
  datetime: string;
  totalHours: number;
  totalPrice: number;
}

interface CreateCompressorRentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: CompressorRentData) => void;
  initialData?: CompressorRentData | null;
}

const EQUIPMENT_OPTIONS = [
  { id: 'jackhammer3', label: '3 отбойных молотка' },
  { id: 'blow_hose', label: 'Шланг для продувки' },
  { id: 'pressure_hose', label: 'Шланг для опрессовки разных труб' }
];

export function CreateCompressorRentModal({ open, onOpenChange, onConfirm, initialData }: CreateCompressorRentModalProps) {
  const [hours, setHours] = useState(7);
  const [location, setLocation] = useState<'city' | 'suburb' | 'far'>('city');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [paymentType, setPaymentType] = useState<'cash' | 'vat'>('cash');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedHour, setSelectedHour] = useState<string>('09');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [totalHours, setTotalHours] = useState(8);
  const [totalPrice, setTotalPrice] = useState(12000);
  const [hoursError, setHoursError] = useState(false);

  // Restore from initialData when modal opens
  useEffect(() => {
    if (open && initialData) {
      setHours(initialData.hours);
      setLocation(initialData.location);
      setEquipment(initialData.equipment);
      setPaymentType(initialData.paymentType);
      setTotalHours(initialData.totalHours);
      setTotalPrice(initialData.totalPrice);
      
      if (initialData.datetime) {
        const date = new Date(initialData.datetime);
        setSelectedDate(date);
        setSelectedHour(date.getHours().toString().padStart(2, '0'));
        setSelectedMinute(date.getMinutes().toString().padStart(2, '0'));
      }
    } else if (open && !initialData) {
      // Set defaults only if no initialData
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow);
    }
  }, [open, initialData]);

  // Calculate total hours based on base hours and location
  useEffect(() => {
    let extraHours = 0;
    
    if (location === 'city') {
      extraHours = 1;
    } else if (location === 'suburb') {
      extraHours = 2;
    } else if (location === 'far') {
      // Договорное время - не добавляем автоматически
      extraHours = 0;
    }
    
    const calculatedTotal = hours + extraHours;
    setTotalHours(calculatedTotal);
  }, [hours, location]);

  // Calculate total price
  useEffect(() => {
    const pricePerHour = paymentType === 'cash' ? 1500 : 1800; // 1500 + 300 НДС
    setTotalPrice(totalHours * pricePerHour);
  }, [totalHours, paymentType]);

  const handleEquipmentToggle = (equipmentId: string) => {
    setEquipment(prev => 
      prev.includes(equipmentId) 
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const handleConfirm = () => {
    // Validate hours before confirming
    if (hours < 7) {
      toast({
        title: "Ошибка",
        description: "Минимальное время аренды — 7 часов",
        variant: "destructive",
      });
      return;
    }

    // Validate date selection
    if (!selectedDate) {
      toast({
        title: "Ошибка",
        description: "Выберите дату",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const datetime = new Date(selectedDate);
    datetime.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);

    const data: CompressorRentData = {
      hours,
      location,
      equipment,
      paymentType,
      datetime: datetime.toISOString(),
      totalHours,
      totalPrice
    };

    // Call onConfirm to save data
    onConfirm(data);
    
    // Show success message
    toast({
      title: "Сохранено!",
      description: `Аренда компрессора: ${totalHours} ч, ${totalPrice.toLocaleString('ru-RU')} ₽`,
    });
    
    // Close modal - data will be preserved via initialData prop
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🚚 Аренда Компрессора на базе газель с машинистом</DialogTitle>
          <DialogDescription>
            Компрессор для пневмоинструмента с оборудованием: отбойные молотки, продувочные шланги
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Alert */}
          <Alert className="bg-primary/10 border-primary/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              После создания объявления вам поступит в личные сообщения контакты для связи по заказу техники
            </AlertDescription>
          </Alert>

          {/* Hours Input */}
          <div className="space-y-2">
            <Label htmlFor="hours">Время аренды (минимум 7 часов)</Label>
            <Input
              id="hours"
              type="number"
              min="1"
              value={hours}
              onChange={(e) => {
                const value = Number(e.target.value);
                setHours(value);
                
                if (value < 7) {
                  setHoursError(true);
                  toast({
                    title: "Ошибка",
                    description: "Минимальное время аренды — 7 часов",
                    variant: "destructive",
                  });
                } else {
                  setHoursError(false);
                }
              }}
              className={`bg-steel-700/50 ${hoursError ? 'border-red-500' : ''}`}
            />
            {hoursError && (
              <p className="text-sm text-red-500">
                Минимальное время — 7 часов
              </p>
            )}
          </div>

          {/* Location Selection */}
          <div className="space-y-3">
            <Label>Локация (влияет на время подачи)</Label>
            <RadioGroup value={location} onValueChange={(value) => setLocation(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="city" id="city" />
                <Label htmlFor="city" className="font-normal cursor-pointer">
                  В городе (+1 час на подачу)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="suburb" id="suburb" />
                <Label htmlFor="suburb" className="font-normal cursor-pointer">
                  Загородом (+2 часа на подачу)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="far" id="far" />
                <Label htmlFor="far" className="font-normal cursor-pointer">
                  Слишком далеко (договорное время)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Equipment Selection */}
          <div className="space-y-3">
            <Label>Оборудование (не влияет на цену)</Label>
            <div className="space-y-2">
              {EQUIPMENT_OPTIONS.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={item.id}
                    checked={equipment.includes(item.id)}
                    onCheckedChange={() => handleEquipmentToggle(item.id)}
                  />
                  <Label htmlFor={item.id} className="font-normal cursor-pointer">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-3">
            <Label>Тип оплаты</Label>
            <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="font-normal cursor-pointer">
                  За наличку (1 500 ₽/час)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vat" id="vat" />
                <Label htmlFor="vat" className="font-normal cursor-pointer">
                  С НДС (1 800 ₽/час)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date and Time Selection */}
          <div className="space-y-3">
            <Label>На какое время</Label>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-steel-700/50",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd.MM.yyyy", { locale: ru }) : <span>дд.мм.гггг</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(0, 0, 0, 0);
                      return date < tomorrow;
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {/* Time Selection */}
              <div className="flex gap-2">
                <Select value={selectedHour} onValueChange={setSelectedHour}>
                  <SelectTrigger className="bg-steel-700/50">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <span className="flex items-center text-steel-400">:</span>
                <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                  <SelectTrigger className="bg-steel-700/50">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {['00', '15', '30', '45'].map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Компрессор необходимо заказывать заранее минимум за день
              </AlertDescription>
            </Alert>
          </div>

          {/* Summary */}
          <div className="bg-steel-700/30 p-4 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span>Базовое время аренды:</span>
              <span className="font-semibold">{hours} ч</span>
            </div>
            <div className="flex justify-between">
              <span>Время на подачу:</span>
              <span className="font-semibold">
                {location === 'city' ? '+1 ч' : location === 'suburb' ? '+2 ч' : 'Договорное'}
              </span>
            </div>
            <div className="flex justify-between text-xl font-bold">
              <span>Общее количество часов:</span>
              <span className="text-primary">{totalHours} ч</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-primary">
              <span>Итого к оплате:</span>
              <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={hoursError || hours < 7}
            >
              Подтвердить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
