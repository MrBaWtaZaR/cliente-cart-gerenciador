
import { Phone } from 'lucide-react';

interface PhoneFormatterProps {
  phone: string;
  showIcon?: boolean;
}

export const PhoneFormatter = ({ phone, showIcon = false }: PhoneFormatterProps) => {
  const formatPhone = (phoneNumber: string): string => {
    // Remove non-numeric characters
    const numbers = phoneNumber.replace(/\D/g, '');
    
    if (numbers.length <= 10) {
      // Format as (XX) XXXX-XXXX
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      // Format as (XX) XXXXX-XXXX for mobile numbers
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {showIcon && <Phone size={16} className="text-muted-foreground" />}
      <span>{formatPhone(phone)}</span>
    </div>
  );
};
