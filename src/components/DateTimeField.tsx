import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateTimeFieldProps {
  value?: string;
  onChange: (value: string) => void;
}

export function DateTimeField({ value, onChange }: DateTimeFieldProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = useState<string>('09');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');

  // Initialize from value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setSelectedHour(date.getHours().toString().padStart(2, '0'));
      setSelectedMinute(date.getMinutes().toString().padStart(2, '0'));
    }
  }, []); // Only on mount

  const updateDateTime = (date: Date | undefined, hour: string, minute: string) => {
    if (!date) {
      date = new Date();
    }
    const newDate = new Date(date);
    newDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
    onChange(newDate.toISOString().slice(0, 16));
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      updateDateTime(date, selectedHour, selectedMinute);
    }
  };

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour);
    updateDateTime(selectedDate, hour, selectedMinute);
  };

  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute);
    updateDateTime(selectedDate, selectedHour, minute);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal bg-steel-700/50",
              !selectedDate && "text-muted-foreground"
            )}
          >
            {selectedDate ? format(selectedDate, "dd.MM.yyyy", { locale: ru }) : <span>дд.мм.гггг</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      
      <div className="flex gap-1">
        <Select value={selectedHour} onValueChange={handleHourChange}>
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
        <Select value={selectedMinute} onValueChange={handleMinuteChange}>
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
  );
}
