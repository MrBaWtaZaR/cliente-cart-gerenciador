
import React from 'react';
import { Customer } from '@/lib/data';
import { calculateServiceFee, formatCurrency } from '@/utils/pdfHelpers';

interface PDFTableProps {
  customers: Customer[];
}

export const PDFTable = ({ customers }: PDFTableProps) => {
  const totalOrderAmount = customers.reduce((sum, customer) => {
    const latestOrder = customer.orders?.reduce((latest, current) =>
      new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    );
    return sum + (latestOrder?.total || 0);
  }, 0);

  const totalServiceFeeAmount = customers.reduce((sum, customer) => {
    const latestOrder = customer.orders?.reduce((latest, current) =>
      new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    );
    return sum + calculateServiceFee(latestOrder?.total || 0);
  }, 0);

  const grandTotal = totalOrderAmount + totalServiceFeeAmount;

  return (
    <div className="modern-table-container">
      <table className="modern-shipment-table">
        <thead>
          <tr>
            <th className="table-header-index">#</th>
            <th className="table-header-name">Cliente</th>
            <th className="table-header-tour">Excursão</th>
            <th className="table-header-amount">Valor da Compra</th>
            <th className="table-header-service">Taxa de Serviço</th>
            <th className="table-header-total">Total</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, idx) => {
            const latestOrder = customer.orders?.reduce((latest, current) =>
              new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
            );
            const orderTotal = latestOrder?.total || 0;
            const serviceFee = calculateServiceFee(orderTotal);
            const total = orderTotal + serviceFee;

            return (
              <tr key={idx} className={`table-row ${idx % 2 === 0 ? 'row-even' : 'row-odd'}`}>
                <td className="table-cell-index">{String(idx + 1).padStart(2, '0')}</td>
                <td className="table-cell-name">
                  <div className="customer-name">{customer.name}</div>
                  {customer.phone && (
                    <div className="customer-phone">{customer.phone}</div>
                  )}
                </td>
                <td className="table-cell-tour">
                  <div className="tour-info">
                    {customer.tourName && (
                      <div className="tour-name">{customer.tourName}</div>
                    )}
                    {customer.tourSeatNumber && (
                      <div className="tour-seat">Vaga: {customer.tourSeatNumber}</div>
                    )}
                  </div>
                </td>
                <td className="table-cell-amount">{formatCurrency(orderTotal)}</td>
                <td className="table-cell-service">{formatCurrency(serviceFee)}</td>
                <td className="table-cell-total">{formatCurrency(total)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="table-footer-summary">
            <td colSpan={3} className="summary-label">RESUMO GERAL</td>
            <td className="table-cell-amount summary-amount">{formatCurrency(totalOrderAmount)}</td>
            <td className="table-cell-service summary-service">{formatCurrency(totalServiceFeeAmount)}</td>
            <td className="table-cell-total summary-total">{formatCurrency(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
