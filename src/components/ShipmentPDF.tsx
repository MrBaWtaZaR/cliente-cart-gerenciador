
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

    // Function to format currency
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
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
                const latestOrder = customer.orders && customer.orders.length > 0 
                  ? customer.orders.reduce((latest, current) => 
                      new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                    ) 
                  : null;
                
                const orderTotal = latestOrder?.total || 0;
                const serviceFee = calculateServiceFee(orderTotal);
                const total = orderTotal + serviceFee;

                return (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-3 px-3">{customer.name}</td>
                    <td className="py-3 px-3 text-right">
                      {formatCurrency(orderTotal)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatCurrency(serviceFee)}
                    </td>
                    <td className="py-3 px-3 text-right"></td>
                    <td className="py-3 px-3 text-right">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-100">
                <td colSpan={1} className="py-3 px-3 text-left">Total:</td>
                <td className="py-3 px-3 text-right">
                  {formatCurrency(shipmentCustomers.reduce((sum, customer) => {
                    const latestOrder = customer.orders && customer.orders.length > 0 
                      ? customer.orders.reduce((latest, current) => 
                          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                        ) 
                      : null;
                    return sum + (latestOrder?.total || 0);
                  }, 0))}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatCurrency(shipmentCustomers.reduce((sum, customer) => {
                    const latestOrder = customer.orders && customer.orders.length > 0 
                      ? customer.orders.reduce((latest, current) => 
                          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                        ) 
                      : null;
                    return sum + calculateServiceFee(latestOrder?.total || 0);
                  }, 0))}
                </td>
                <td className="py-3 px-3 text-right"></td>
                <td className="py-3 px-3 text-right">
                  {formatCurrency(shipmentCustomers.reduce((sum, customer) => {
                    const latestOrder = customer.orders && customer.orders.length > 0 
                      ? customer.orders.reduce((latest, current) => 
                          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                        ) 
                      : null;
                    const orderTotal = latestOrder?.total || 0;
                    const serviceFee = calculateServiceFee(orderTotal);
                    return sum + orderTotal + serviceFee;
                  }, 0))}
                </td>
              </tr>
            </tfoot>
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
      <div ref={ref} className="bg-white p-10 mx-auto text-black">
        {customerPairs.map((pair, pairIndex) => (
          <div key={pairIndex} className={`grid grid-cols-1 gap-10 mb-0 ${pairIndex > 0 ? 'mt-10 page-break-before' : ''}`}>
            {pair.map((customer, idx) => (
              <div key={idx} className="border-2 border-dashed border-gray-300 p-4 rounded-lg h-[calc(50vh-20px)]">
                <div className="text-center mb-4 pb-2 border-b border-gray-200">
                  <h3 className="font-bold text-lg">{customer.tourName || "Excursão"}</h3>
                </div>
                
                {/* Informações em duas colunas */}
                <div className="flex flex-row space-x-4">
                  {/* Coluna 1: Dados da excursão */}
                  <div className="w-1/2 text-sm space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="font-medium">Setor:</p>
                        <p className="truncate text-lg">{customer.tourSector || "-"}</p>
                      </div>
                      <div>
                        <p className="font-medium">Vaga:</p>
                        <p className="text-lg">{customer.tourSeatNumber || "-"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Horário:</p>
                      <p className="text-lg">{customer.tourDepartureTime || "-"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Cidade/UF:</p>
                      <p className="truncate text-lg">{[customer.tourCity, customer.tourState].filter(Boolean).join('/')}</p>
                    </div>
                  </div>
                  
                  {/* Coluna 2: Dados pessoais */}
                  <div className="w-1/2 border-l pl-4 text-sm space-y-3">
                    <div>
                      <p className="font-medium">Nome:</p>
                      <p className="truncate font-semibold text-lg">{customer.name}</p>
                    </div>
                    <div>
                      <p className="font-medium">Telefone:</p>
                      <p className="text-lg">{formatPhone(customer.phone)}</p>
                    </div>
                  </div>
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
            @page {
              margin: 10px;
              size: auto;
            }
          }
        `}</style>
      </div>
    );
  }
);

ShipmentCardsPDF.displayName = 'ShipmentCardsPDF';
