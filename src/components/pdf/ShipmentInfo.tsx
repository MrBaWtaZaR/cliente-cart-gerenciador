
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ShipmentInfoProps {
  date: Date;
  customerCount: number;
  totalAmount: number;
}

export const ShipmentInfo = ({ date, customerCount, totalAmount }: ShipmentInfoProps) => {
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="shipment-info">
      <h2>Relatório de Envio</h2>
      <p><strong>Data de Geração:</strong> {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      <p><strong>Total de Clientes:</strong> {customerCount}</p>
      <p><strong>Valor Total Geral:</strong> {formatCurrency(totalAmount)}</p>
    </div>
  );
};
