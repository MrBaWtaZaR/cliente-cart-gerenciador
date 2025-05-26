
export const calculateServiceFee = (total: number): number => Math.max(60, total * 0.1);

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatPhone = (phone: string): string => {
  if (!phone) return "";
  const numbers = phone.replace(/\D/g, '');
  return numbers.length <= 10
    ? numbers.replace(/(\d{2})(\d{0,4})(\d{0,4})/, '($1) $2-$3')
    : numbers.replace(/(\d{2})(\d{0,5})(\d{0,4})/, '($1) $2-$3');
};
