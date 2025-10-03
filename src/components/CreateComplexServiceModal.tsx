import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { CreateCompressorRentModal } from '@/components/CreateCompressorRentModal';
import { CreateGarbageRemovalModal } from '@/components/CreateGarbageRemovalModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Wrench, Truck, Package } from 'lucide-react';

interface CreateComplexServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ServiceStep = 'selection' | 'workers' | 'compressor' | 'garbage' | 'summary';

interface SelectedService {
  type: 'workers' | 'compressor' | 'garbage';
  data: any;
  cost: number;
}

export const CreateComplexServiceModal: React.FC<CreateComplexServiceModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<ServiceStep>('selection');
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [loading, setLoading] = useState(false);

  const handleServiceComplete = (type: 'workers' | 'compressor' | 'garbage', data: any, cost: number) => {
    setSelectedServices(prev => [
      ...prev.filter(s => s.type !== type),
      { type, data, cost }
    ]);
    setCurrentStep('selection');
  };

  const handleFinishOrder = async () => {
    if (!user || selectedServices.length === 0) {
      toast.error('Выберите хотя бы одну услугу');
      return;
    }

    setLoading(true);
    
    try {
      const totalCost = selectedServices.reduce((sum, service) => sum + service.cost, 0);
      
      // Получаем номер заказа с типом
      const { data: orderNumberData, error: numberError } = await supabase
        .rpc('generate_order_number_with_type', { p_service_type: 'complex_service' });

      if (numberError) throw numberError;

      const serviceNames = selectedServices.map(s => {
        switch (s.type) {
          case 'workers': return 'Грузчики';
          case 'compressor': return 'Аренда компрессора';
          case 'garbage': return 'Вывоз мусора';
          default: return s.type;
        }
      }).join(' + ');

      const { error } = await supabase.from('orders').insert({
        order_number: orderNumberData,
        title: `Комплексная услуга: ${serviceNames}`,
        description: `Заказ включает: ${serviceNames}`,
        category: 'Комплексная услуга',
        service_type: 'complex_service',
        price: totalCost,
        client_id: user.id,
        status: 'pending',
        equipment_details: {
          services: selectedServices.map(s => ({
            type: s.type,
            data: s.data,
            cost: s.cost
          })),
          totalCost,
          serviceCount: selectedServices.length
        }
      });

      if (error) throw error;

      toast.success('Комплексный заказ создан!');
      onClose();
      setSelectedServices([]);
      setCurrentStep('selection');
    } catch (error) {
      console.error('Error creating complex order:', error);
      toast.error('Ошибка при создании заказа');
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'workers': return <Users className="w-5 h-5" />;
      case 'compressor': return <Wrench className="w-5 h-5" />;
      case 'garbage': return <Truck className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getServiceName = (type: string) => {
    switch (type) {
      case 'workers': return 'Грузчики';
      case 'compressor': return 'Аренда компрессора';
      case 'garbage': return 'Вывоз мусора';
      default: return type;
    }
  };

  const totalCost = selectedServices.reduce((sum, service) => sum + service.cost, 0);

  return (
    <>
      <Dialog open={isOpen && currentStep === 'selection'} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Заказать всё вместе
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <p className="text-muted-foreground">
              Выберите необходимые услуги и создайте комплексный заказ:
            </p>

            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => setCurrentStep('workers')}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold">Грузчики</div>
                    <div className="text-sm text-muted-foreground">
                      Заказать грузчиков для работы
                    </div>
                  </div>
                  {selectedServices.find(s => s.type === 'workers') && (
                    <div className="ml-auto text-green-600 font-semibold">✓</div>
                  )}
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => setCurrentStep('compressor')}
              >
                <div className="flex items-center gap-3">
                  <Wrench className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold">Аренда компрессора</div>
                    <div className="text-sm text-muted-foreground">
                      Арендовать компрессорное оборудование
                    </div>
                  </div>
                  {selectedServices.find(s => s.type === 'compressor') && (
                    <div className="ml-auto text-green-600 font-semibold">✓</div>
                  )}
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => setCurrentStep('garbage')}
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold">Вывоз мусора</div>
                    <div className="text-sm text-muted-foreground">
                      Заказать вывоз мусора
                    </div>
                  </div>
                  {selectedServices.find(s => s.type === 'garbage') && (
                    <div className="ml-auto text-green-600 font-semibold">✓</div>
                  )}
                </div>
              </Button>
            </div>

            {selectedServices.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">Выбранные услуги:</h3>
                  {selectedServices.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {getServiceIcon(service.type)}
                        <span className="font-medium">{getServiceName(service.type)}</span>
                      </div>
                      <div className="font-semibold text-primary">{service.cost.toLocaleString()} ₽</div>
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <span className="font-semibold text-lg text-foreground">Общая стоимость:</span>
                    <span className="font-bold text-2xl text-primary">{totalCost.toLocaleString()} ₽</span>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              {selectedServices.length > 0 && (
                <Button onClick={handleFinishOrder} disabled={loading} className="flex-1">
                  {loading ? 'Создание заказа...' : 'Создать комплексный заказ'}
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                {selectedServices.length > 0 ? 'Отмена' : 'Закрыть'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateOrderModal
        isOpen={currentStep === 'workers'}
        onClose={() => setCurrentStep('selection')}
        onOrderCreated={() => setCurrentStep('selection')}
      />

      <CreateCompressorRentModal
        isOpen={currentStep === 'compressor'}
        onClose={() => setCurrentStep('selection')}
      />

      <CreateGarbageRemovalModal
        isOpen={currentStep === 'garbage'}
        onClose={() => setCurrentStep('selection')}
      />
    </>
  );
};