
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateFilterProps {
  onDateChange: (date: Date | undefined) => void;
}

export const DateFilter = ({ onDateChange }: DateFilterProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    onDateChange(selectedDate);
  };

  const clearFilter = () => {
    setDate(undefined);
    onDateChange(undefined);
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={date ? "default" : "outline"} 
            className="gap-2"
          >
            <CalendarDays size={16} />
            {date ? format(date, 'P', { locale: ptBR }) : "Filtrar por data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      {date && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilter}
        >
          Limpar
        </Button>
      )}
    </div>
  );
};
