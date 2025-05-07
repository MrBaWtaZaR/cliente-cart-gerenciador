
import { Clock } from 'lucide-react';

interface TimeFormatterProps {
  time: string;
  showIcon?: boolean;
}

export const TimeFormatter = ({ time, showIcon = false }: TimeFormatterProps) => {
  const formatTime = (timeString: string): string => {
    // Handle different time formats
    if (!timeString) return '';
    
    // If it's already in HH:MM format, return as is
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    
    try {
      // Try to parse as a date and format
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      // Fall back to the original string if parsing fails
      console.error("Error formatting time:", e);
    }
    
    return timeString;
  };

  return (
    <div className="flex items-center space-x-2">
      {showIcon && <Clock size={16} className="text-muted-foreground" />}
      <span>{formatTime(time)}</span>
    </div>
  );
};
