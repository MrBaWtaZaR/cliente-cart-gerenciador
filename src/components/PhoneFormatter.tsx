
import { Phone } from 'lucide-react';

interface PhoneFormatterProps {
  phone: string;
  showIcon?: boolean;
}

export const PhoneFormatter = ({ phone, showIcon = false }: PhoneFormatterProps) => {
  const formatPhone = (phoneNumber: string): string => {
    // Remove non-numeric characters
    const numbers = phoneNumber.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    
    if (numbers.length <= 10) {
      // Format as (XX) XXXX-XXXX for landline numbers
      return numbers.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_, p1, p2, p3) => {
        let result = '';
        if (p1) result += `(${p1})`;
        if (p2) result += ` ${p2}`;
        if (p3) result += `-${p3}`;
        return result;
      }).trim();
    } else {
      // Format as (XX) XXXXX-XXXX for mobile numbers
      return numbers.replace(/(\d{2})(\d{0,5})(\d{0,4})/, (_, p1, p2, p3) => {
        let result = '';
        if (p1) result += `(${p1})`;
        if (p2) result += ` ${p2}`;
        if (p3) result += `-${p3}`;
        return result;
      }).trim();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {showIcon && <Phone size={16} className="text-muted-foreground" />}
      <span>{formatPhone(phone)}</span>
    </div>
  );
};
