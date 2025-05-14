
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Customer } from '@/lib/data';
import { Shipment } from '@/types/shipments';

interface ShipmentPDFProps {
  shipmentCustomers: Customer[];
  date: Date;
}

export const ShipmentTablePDF = React.forwardRef<HTMLDivElement, ShipmentPDFProps>(
  ({ shipmentCustomers, date }, ref) => {
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

    const currentDate = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    return (
      <div ref={ref} className="bg-white p-4 max-w-4xl mx-auto text-black shipment-print-container">
        {/* Cabeçalho com Logo - Reduzido o padding para diminuir margem superior */}
        <div className="border-b-2 border-blue-800 pb-2 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/918a2f2c-f5f0-4ea6-8676-f08b6d93bb99.png" 
                alt="AF Consultoria" 
                className="h-16 mr-4"
              />
              <div>
                <h1 className="text-2xl font-bold text-blue-800">AF Consultoria</h1>
                <p className="text-sm text-gray-600">Tabela de Envio</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Data de emissão: {currentDate}</p>
            </div>
          </div>
        </div>

        {/* Tabela de clientes - Modernizada com mais espaçamento e cores melhoradas */}
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-3 text-blue-800">Lista de Clientes para Envio</h2>
          <div className="overflow-hidden rounded-lg border border-blue-200 shadow-sm">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-3 px-4 text-left font-medium text-blue-800 border-b border-blue-200">Nome</th>
                  <th className="py-3 px-4 text-right font-medium text-blue-800 border-b border-blue-200">V. da Compra</th>
                  <th className="py-3 px-4 text-right font-medium text-blue-800 border-b border-blue-200">10% Serviço</th>
                  <th className="py-3 px-4 text-right font-medium text-blue-800 border-b border-blue-200">Taxa Emb.</th>
                  <th className="py-3 px-4 text-right font-medium text-blue-800 border-b border-blue-200">Total</th>
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
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                      <td className="py-3 px-4 border-b border-blue-100">{customer.name}</td>
                      <td className="py-3 px-4 text-right border-b border-blue-100">
                        {formatCurrency(orderTotal)}
                      </td>
                      <td className="py-3 px-4 text-right border-b border-blue-100">
                        {formatCurrency(serviceFee)}
                      </td>
                      <td className="py-3 px-4 text-right border-b border-blue-100"></td>
                      <td className="py-3 px-4 text-right border-b border-blue-100 font-medium">
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-blue-100">
                  <td colSpan={1} className="py-3 px-4 text-left">Total:</td>
                  <td className="py-3 px-4 text-right">
                    {formatCurrency(shipmentCustomers.reduce((sum, customer) => {
                      // Find the latest order for this customer
                      const latestOrder = customer.orders && customer.orders.length > 0 
                        ? customer.orders.reduce((latest, current) => 
                            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                          ) 
                        : null;
                      
                      return sum + (latestOrder?.total || 0);
                    }, 0))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {formatCurrency(shipmentCustomers.reduce((sum, customer) => {
                      // Find the latest order for this customer
                      const latestOrder = customer.orders && customer.orders.length > 0 
                        ? customer.orders.reduce((latest, current) => 
                            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                          ) 
                        : null;
                      
                      return sum + calculateServiceFee(latestOrder?.total || 0);
                    }, 0))}
                  </td>
                  <td className="py-3 px-4 text-right"></td>
                  <td className="py-3 px-4 text-right">
                    {formatCurrency(shipmentCustomers.reduce((sum, customer) => {
                      // Find the latest order for this customer
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
        </div>

        {/* Rodapé */}
        <div className="mt-6 pt-4 border-t border-blue-800 text-center text-sm text-gray-600">
          <p>AF Consultoria - Documento gerado em {currentDate}</p>
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
      <div ref={ref} className="bg-white mx-auto text-black shipment-print-container">
        {customerPairs.map((pair, pairIndex) => (
          <div 
            key={pairIndex} 
            className={`grid grid-cols-1 gap-4 ${pairIndex > 0 ? 'page-break-before' : ''}`}
            style={{ height: "297mm", padding: "10px" }}
          >
            {pair.map((customer, idx) => (
              <div 
                key={idx} 
                className="border-2 border-dashed border-blue-800 rounded-lg flex flex-col"
                style={{ height: "calc(50% - 10px)" }}
              >
                {/* Logo no topo do cartão */}
                <div className="bg-blue-50 p-2 flex justify-center border-b border-blue-200">
                  <img 
                    src="/lovable-uploads/918a2f2c-f5f0-4ea6-8676-f08b6d93bb99.png" 
                    alt="AF Consultoria" 
                    className="h-14"
                  />
                </div>
                
                <div className="text-center p-2 pb-1 border-b border-blue-200">
                  <h3 className="font-bold text-xl text-blue-800">{customer.tourName || "Excursão"}</h3>
                </div>
                
                {/* Informações em duas colunas */}
                <div className="flex flex-row p-3 flex-1">
                  {/* Coluna 1: Dados da excursão */}
                  <div className="w-1/2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="font-bold text-sm text-blue-700">Setor:</p>
                        <p className="truncate text-2xl font-bold">{customer.tourSector || "-"}</p>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-blue-700">Vaga:</p>
                        <p className="text-2xl font-bold">{customer.tourSeatNumber || "-"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-blue-700">Horário:</p>
                      <p className="text-2xl font-bold">{customer.tourDepartureTime || "-"}</p>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-blue-700">Cidade/UF:</p>
                      <p className="truncate text-xl font-bold">{[customer.tourCity, customer.tourState].filter(Boolean).join('/')}</p>
                    </div>
                  </div>
                  
                  {/* Coluna 2: Dados pessoais */}
                  <div className="w-1/2 border-l border-blue-200 pl-4 space-y-2">
                    <div>
                      <p className="font-bold text-sm text-blue-700">Nome:</p>
                      <p className="truncate text-xl font-bold">{customer.name}</p>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-blue-700">Telefone:</p>
                      <p className="text-xl font-bold">{formatPhone(customer.phone)}</p>
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
              margin: 0;
              size: A4;
            }
            body {
              margin: 0;
            }
          }
        `}</style>
      </div>
    );
  }
);

ShipmentCardsPDF.displayName = 'ShipmentCardsPDF';
