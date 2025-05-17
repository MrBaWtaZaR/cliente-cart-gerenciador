
import { ChangeEvent, useEffect, useRef } from 'react';

export const formatPriceDisplay = (price: number | string): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(typeof price === 'string' ? parseFloat(price) || 0 : price);
};

export const formatPriceInput = (value: string): string => {
  // Remove non-numeric characters except for the decimal point
  let numericValue = value.replace(/[^\d,]/g, '');
  
  // Convert comma to dot for calculation
  const numValue = parseFloat(numericValue.replace(',', '.')) || 0;
  
  // Format back to Brazilian format (with comma)
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const handlePriceInput = (
  e: ChangeEvent<HTMLInputElement>, 
  setStateFunction: (value: number) => void
): void => {
  const inputValue = e.target.value;
  const cursorPosition = e.target.selectionStart;
  
  // Remove non-numeric characters except for comma
  const sanitized = inputValue.replace(/[^\d,]/g, '');
  
  // Convert comma to dot for the calculation
  const numericValue = parseFloat(sanitized.replace(',', '.')) || 0;
  
  // Update the state with the numeric value
  setStateFunction(numericValue);
  
  // Format the input field
  const formattedValue = formatPriceInput(inputValue);
  e.target.value = formattedValue;
  
  // Try to maintain cursor position
  if (cursorPosition !== null) {
    // Calculate new cursor position
    const valueBeforeCursor = inputValue.slice(0, cursorPosition);
    const numericBeforeCursor = valueBeforeCursor.replace(/[^\d,]/g, '').length;
    
    // Set cursor after a small delay to allow React to update the input value
    setTimeout(() => {
      if (e.target) {
        // Find the position in the new formatted string that corresponds to the same number of digits
        let newPosition = 0;
        let digitCount = 0;
        const formatted = e.target.value;
        
        for (let i = 0; i < formatted.length; i++) {
          if (/[\d,]/.test(formatted[i])) {
            digitCount++;
          }
          if (digitCount > numericBeforeCursor) {
            break;
          }
          newPosition = i + 1;
        }
        
        e.target.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  }
};
