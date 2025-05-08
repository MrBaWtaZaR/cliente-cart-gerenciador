
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Customer, Order } from '@/lib/data';

interface ShipmentPDFProps {
  shipmentCustomers: Customer[];
  date: Date;
}

export const ShipmentTablePDF = React.forwardRef<HTMLDivElement, ShipmentPDFProps>(
  ({ shipmentCustomers, date }, ref) => {
    const currentDate = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    // Function to calculate service fee (10% of total)
    const calculateServiceFee = (total: number) => {
      return Math.max(60, total * 0.1);
    };

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto text-black">
        {/* Cabeçalho */}
        <div className="border-b-2 border-gray-300 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-primary">A&F Consultoria</h1>
              <p className="text-sm text-gray-500">Tabela de Envio</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Data de emissão: {currentDate}</p>
            </div>
          </div>
        </div>

        {/* Tabela de clientes */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Lista de Clientes para Envio</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 text-left">Nome</th>
                <th className="py-2 px-3 text-right">V. da Compra</th>
                <th className="py-2 px-3 text-right">10% Serviço</th>
                <th className="py-2 px-3 text-right">Taxa Emb.</th>
                <th className="py-2 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {shipmentCustomers.map((customer, idx) => {
                // Find the latest order for this customer
                const latestOrder = customer.orders.length > 0 
                  ? customer.orders.reduce((latest, current) => 
                      new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                    ) 
                  : null;
                
                const orderTotal = latestOrder?.total || 0;
                const serviceFee = calculateServiceFee(orderTotal);

                return (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-3 px-3">{customer.name}</td>
                    <td className="py-3 px-3 text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(orderTotal)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(serviceFee)}
                    </td>
                    <td className="py-3 px-3 text-right"></td>
                    <td className="py-3 px-3 text-right"></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        <div className="mt-12 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
          <p>A&F Consultoria - Documento gerado em {currentDate}</p>
          <p>Este documento não possui valor fiscal</p>
          <p className="text-xs mt-2">* A taxa mínima de serviço é R$60,00 para compras iguais ou abaixo de R$600,00.</p>
        </div>
      </div>
    );
  }
);

ShipmentTablePDF.displayName = 'ShipmentTablePDF';

export const ShipmentCardsPDF = React.forwardRef<HTMLDivElement, ShipmentPDFProps>(
  ({ shipmentCustomers, date }, ref) => {
    // Function to format phone number
    const formatPhone = (phone: string) => {
      if (!phone) return '';
      const numbers = phone.replace(/\D/g, '');
      
      if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{0,4})(\d{0,4})/, '($1) $2-$3');
      } else {
        return numbers.replace(/(\d{2})(\d{0,5})(\d{0,4})/, '($1) $2-$3');
      }
    };

    // Group customers into pairs for 2 cards per page
    const customerPairs = [];
    for (let i = 0; i < shipmentCustomers.length; i += 2) {
      customerPairs.push(shipmentCustomers.slice(i, i + 2));
    }

    return (
      <div ref={ref} className="bg-white p-8 mx-auto text-black">
        {customerPairs.map((pair, pairIndex) => (
          <div key={pairIndex} className={`grid grid-cols-2 gap-4 mb-8 ${pairIndex > 0 ? 'mt-8 page-break-before' : ''}`}>
            {pair.map((customer, idx) => (
              <div key={idx} className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                <div className="text-center mb-2 pb-2 border-b border-gray-200">
                  <h3 className="font-bold">{customer.tourName || "Excursão"}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p><strong>Setor:</strong></p>
                    <p>{customer.tourSector || "-"}</p>
                  </div>
                  <div>
                    <p><strong>Vaga:</strong></p>
                    <p>{customer.tourSeatNumber || "-"}</p>
                  </div>
                  <div>
                    <p><strong>Horário:</strong></p>
                    <p>{customer.tourDepartureTime || "-"}</p>
                  </div>
                  <div>
                    <p><strong>Cidade/Estado:</strong></p>
                    <p>{[customer.tourCity, customer.tourState].filter(Boolean).join('/')}</p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <p><strong>Nome:</strong> {customer.name}</p>
                  <p><strong>Telefone:</strong> {formatPhone(customer.phone)}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
        <style>{`
          @media print {
            .page-break-before {
              page-break-before: always;
            }
          }
        `}</style>
      </div>
    );
  }
);

ShipmentCardsPDF.displayName = 'ShipmentCardsPDF';
