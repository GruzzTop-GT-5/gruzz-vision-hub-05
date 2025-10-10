import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, User, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RoleSelectionProps {
  isOpen: boolean;
  onComplete: () => void;
}

const EXECUTOR_CATEGORIES = [
  { value: 'loader', label: 'Грузчик', description: 'Погрузка, разгрузка, переноска грузов' },
  { value: 'cleaner', label: 'Уборщик', description: 'Уборка помещений, территорий' },
  { value: 'handyman', label: 'Разнорабочий', description: 'Универсальные работы на объекте' },
  { value: 'builder', label: 'Строитель', description: 'Строительные и ремонтные работы' }
];

const CLIENT_ROLES = [
  { value: 'logistician', label: 'Логист', description: 'Управление логистикой и перевозками' },
  { value: 'client', label: 'Заказчик', description: 'Заказ услуг для личных нужд' },
  { value: 'foreman', label: 'Прораб', description: 'Управление строительными работами' },
  { value: 'manager', label: 'Менеджер', description: 'Управление проектами и персоналом' }
];

export function RoleSelection({ isOpen, onComplete }: RoleSelectionProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'type' | 'subtype'>('type');
  const [selectedType, setSelectedType] = useState<'executor' | 'client' | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = (type: 'executor' | 'client') => {
    setSelectedType(type);
    setStep('subtype');
  };

  const handleSubtypeSelect = (subtype: string) => {
    setSelectedSubtype(subtype);
  };

  const handleSubmit = async () => {
    if (!selectedType || !selectedSubtype) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Ошибка",
          description: "Необходима авторизация",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: selectedType,
          user_subtype: selectedSubtype
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить выбор роли",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Ваша роль успешно установлена!"
      });

      onComplete();
    } catch (error) {
      console.error('Error in role selection:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'subtype') {
      setStep('type');
      setSelectedSubtype(null);
    }
  };

  const subtypeOptions = selectedType === 'executor' ? EXECUTOR_CATEGORIES : CLIENT_ROLES;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="card-steel max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-steel-100">
            {step === 'type' ? 'Выберите тип профиля' : 'Выберите вашу роль'}
          </DialogTitle>
          <DialogDescription className="text-steel-300">
            {step === 'type' 
              ? 'Определите, кем вы являетесь на платформе'
              : selectedType === 'executor'
                ? 'Выберите категорию работ, которые вы выполняете'
                : 'Выберите вашу должность или роль'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'type' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card 
              className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedType === 'executor' 
                  ? 'border-2 border-primary bg-primary/10' 
                  : 'border border-steel-600 hover:border-primary/50'
              }`}
              onClick={() => handleTypeSelect('executor')}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-electric-600 flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-steel-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-steel-100 mb-2">Исполнитель</h3>
                  <p className="text-sm text-steel-400">
                    Я предлагаю свои услуги и выполняю заказы
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  4 категории работ
                </Badge>
              </div>
            </Card>

            <Card 
              className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedType === 'client' 
                  ? 'border-2 border-primary bg-primary/10' 
                  : 'border border-steel-600 hover:border-primary/50'
              }`}
              onClick={() => handleTypeSelect('client')}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-electric-500 to-electric-700 flex items-center justify-center">
                  <User className="w-8 h-8 text-steel-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-steel-100 mb-2">Заказчик</h3>
                  <p className="text-sm text-steel-400">
                    Я размещаю заказы и нанимаю исполнителей
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  4 роли
                </Badge>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-3">
              {subtypeOptions.map((option) => (
                <Card
                  key={option.value}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:scale-102 ${
                    selectedSubtype === option.value
                      ? 'border-2 border-primary bg-primary/10'
                      : 'border border-steel-600 hover:border-primary/50'
                  }`}
                  onClick={() => handleSubtypeSelect(option.value)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-steel-100 mb-1">
                        {option.label}
                      </h4>
                      <p className="text-sm text-steel-400">
                        {option.description}
                      </p>
                    </div>
                    {selectedSubtype === option.value && (
                      <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 ml-3" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1"
              >
                Назад
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedSubtype || isSubmitting}
                className="flex-1 bg-primary hover:bg-primary/80"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Завершить регистрацию'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
