import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface MultiSelectSpecializationsProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  maxSelections?: number;
}

export const MultiSelectSpecializations = ({
  value,
  onChange,
  options,
  maxSelections = 999
}: MultiSelectSpecializationsProps) => {
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleSelection = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option));
    } else {
      // Проверяем максимальное количество выбранных элементов
      if (value.length >= maxSelections) {
        return; // Не добавляем, если достигнут максимум
      }
      onChange([...value, option]);
    }
  };

  const handleAddCustom = () => {
    if (customValue.trim() && !value.includes(customValue.trim())) {
      // Проверяем максимальное количество выбранных элементов
      if (value.length >= maxSelections) {
        return; // Не добавляем, если достигнут максимум
      }
      onChange([...value, customValue.trim()]);
      setCustomValue('');
      setShowCustomInput(false);
    }
  };

  const removeItem = (item: string) => {
    onChange(value.filter(v => v !== item));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal input-steel bg-steel-800/80 border-steel-600 h-auto min-h-[2.75rem] py-2"
          >
            {value.length === 0 ? (
              <span className="text-steel-400">Выберите до {maxSelections} специализаций...</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {value.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20 text-xs"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-steel-800 border-steel-600 z-50" align="start">
          <div className="max-h-60 overflow-y-auto p-2">
            {options.map((option) => {
              const isSelected = value.includes(option);
              const isOther = option === 'Другое';
              
              const isDisabled = !isSelected && value.length >= maxSelections;
              
              return (
                <div
                  key={option}
                  onClick={() => {
                    if (isDisabled) return;
                    if (isOther) {
                      setShowCustomInput(true);
                    } else {
                      toggleSelection(option);
                    }
                  }}
                  className={`flex items-center space-x-2 px-2 py-1.5 rounded text-sm ${
                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-steel-700'
                  } text-steel-100`}
                >
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                    isSelected ? 'bg-primary border-primary' : 'border-steel-500'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-steel-900" />}
                  </div>
                  <span>{option}</span>
                </div>
              );
            })}

            {/* Custom input */}
            {showCustomInput && (
              <div className="mt-2 p-2 border-t border-steel-600 space-y-2">
                <Input
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="Введите свою специализацию"
                  className="input-steel text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCustom();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddCustom}
                    className="flex-1 h-8 text-xs"
                  >
                    Добавить
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomValue('');
                    }}
                    className="h-8 text-xs"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected items as removable badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item) => (
            <Badge
              key={item}
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 pr-1 text-xs"
            >
              {item}
              <button
                onClick={() => removeItem(item)}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};