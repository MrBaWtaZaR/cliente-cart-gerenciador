
import { ChangeEvent } from 'react';

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
  
  // Remove non-numeric characters except for comma
  const sanitized = inputValue.replace(/[^\d,]/g, '');
  
  // Convert comma to dot for the calculation
  const numericValue = parseFloat(sanitized.replace(',', '.')) || 0;
  
  // Update the state with the numeric value
  setStateFunction(numericValue);
  
  // Format the input field
  e.target.value = formatPriceInput(inputValue);
};
