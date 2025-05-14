
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Customer } from '@/lib/data';
import { Shipment } from '@/types/shipments';
import { PrintablePDF, PrintablePDFRef } from './PrintablePDF';

interface ShipmentPDFProps {
  shipmentCustomers: Customer[];
  date: Date;
}

// Reusable Image component for shipment PDFs
const ShipmentImage = ({ src, alt, className = "" }) => {
  return (
    <img 
      src={src} 
      alt={alt}
      className={`${className} print:opacity-100`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};

export const ShipmentTablePDF = React.forwardRef<PrintablePDFRef, ShipmentPDFProps>(
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
      <PrintablePDF ref={ref} className="shipment-print-container">
        <div className="bg-white p-2 max-w-4xl mx-auto text-black print:w-full print:max-w-none">
          {/* Cabeçalho com Logo - Reduzido o padding para diminuir margem superior */}
          <div className="border-b-2 border-blue-800 pb-2 mb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-16 h-16 relative flex items-center justify-center mr-2 flex-shrink-0">
                  <ShipmentImage 
                    src="/lovable-uploads/918a2f2c-f5f0-4ea6-8676-f08b6d93bb99.png" 
                    alt="AF Consultoria" 
                    className="h-16 object-contain"
                  />
                </div>
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
          <div className="mb-3">
            <h2 className="text-lg font-bold mb-2 text-blue-800 flex items-center">
              <span className="bg-blue-100 p-1 rounded-md mr-2 inline-flex items-center justify-center w-6 h-6 text-center">
                <span className="text-blue-800">≡</span>
              </span>
              Lista de Clientes para Envio
            </h2>
            <div className="overflow-hidden rounded-lg border border-blue-200 shadow-sm">
              <table className="w-full border-collapse bg-white" style={{borderCollapse: 'collapse'}}>
                <thead>
                  <tr className="bg-gradient-to-r from-blue-100 to-blue-50 print:bg-blue-100">
                    <th className="py-2 px-3 text-left font-medium text-blue-800 border-b border-blue-200">Nome</th>
                    <th className="py-2 px-3 text-right font-medium text-blue-800 border-b border-blue-200">V. da Compra</th>
                    <th className="py-2 px-3 text-right font-medium text-blue-800 border-b border-blue-200">10% Serviço</th>
                    <th className="py-2 px-3 text-right font-medium text-blue-800 border-b border-blue-200">Taxa Emb.</th>
                    <th className="py-2 px-3 text-right font-medium text-blue-800 border-b border-blue-200">Total</th>
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
                        <td className="py-2 px-3 border-b border-blue-100">{customer.name}</td>
                        <td className="py-2 px-3 text-right border-b border-blue-100">
                          {formatCurrency(orderTotal)}
                        </td>
                        <td className="py-2 px-3 text-right border-b border-blue-100">
                          {formatCurrency(serviceFee)}
                        </td>
                        <td className="py-2 px-3 text-right border-b border-blue-100"></td>
                        <td className="py-2 px-3 text-right border-b border-blue-100 font-medium">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-bold bg-gradient-to-r from-blue-100 to-blue-50 print:bg-blue-100">
                    <td colSpan={1} className="py-2 px-3 text-left">Total:</td>
                    <td className="py-2 px-3 text-right">
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
                    <td className="py-2 px-3 text-right">
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
                    <td className="py-2 px-3 text-right"></td>
                    <td className="py-2 px-3 text-right">
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
          <div className="mt-4 pt-2 border-t border-blue-800 text-center text-sm text-gray-600">
            <p>AF Consultoria - Documento gerado em {currentDate}</p>
            <p>Este documento não possui valor fiscal</p>
            <p className="text-xs mt-1">* A taxa mínima de serviço é R$60,00 para compras iguais ou abaixo de R$600,00.</p>
          </div>
        </div>
      </PrintablePDF>
    );
  }
);

ShipmentTablePDF.displayName = 'ShipmentTablePDF';

export const ShipmentCardsPDF = React.forwardRef<PrintablePDFRef, ShipmentPDFProps>(
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
    
    // Format city and state
    const formatCityState = (city?: string, state?: string) => {
      if (city && state) {
        return `${city.toUpperCase()} - ${state.toUpperCase()}`;
      } else if (city) {
        return city.toUpperCase();
      } else if (state) {
        return state.toUpperCase();
      }
      return '-';
    };

    // Group customers into pairs for 2 cards per page
    const customerPairs = [];
    for (let i = 0; i < shipmentCustomers.length; i += 2) {
      customerPairs.push(shipmentCustomers.slice(i, i + 2));
    }

    return (
      <PrintablePDF ref={ref} className="shipment-print-container">
        <div className="bg-white mx-auto text-black font-[Montserrat]">
          {customerPairs.map((pair, pairIndex) => (
            <div 
              key={pairIndex} 
              className={`flex flex-col gap-6 items-center ${pairIndex > 0 ? 'page-break-before' : ''}`}
              style={{ height: "297mm", padding: "16px" }}
            >
              {pair.map((customer, idx) => (
                <div 
                  key={idx} 
                  className="w-4/5 h-[45%] border-2 border-[#1C3553] rounded-lg flex flex-col bg-white relative overflow-hidden"
                >
                  {/* Volume indicator */}
                  <div className="absolute top-3 left-3 w-12 h-12 rounded-full bg-[#1C3553] flex items-center justify-center">
                    <p className="text-white font-bold text-sm">Vol. 01</p>
                  </div>
                  
                  {/* Excursão section */}
                  <div className="flex flex-col items-center pt-6 px-6">
                    <h3 className="font-bold text-2xl uppercase mb-1">EXCURSÃO</h3>
                    <h4 className="font-bold text-xl uppercase mb-2">{customer.tourName || "BENTO TURISMO"}</h4>
                    
                    <div className="flex justify-between w-full">
                      <div className="flex flex-col">
                        <p className="font-medium">
                          <span className="font-bold">Setor:</span> {customer.tourSector || "-"}
                        </p>
                        <p className="font-medium">
                          <span className="font-bold">Vaga:</span> {customer.tourSeatNumber || "-"}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-lg">{customer.tourDepartureTime || "-"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Separating line */}
                  <div className="w-full h-1 bg-[#1C3553] my-3"></div>
                  
                  {/* Cliente section */}
                  <div className="flex flex-col items-center px-6 flex-grow">
                    <h3 className="font-bold text-xl uppercase mb-1">CLIENTE</h3>
                    <h4 className="font-bold text-xl uppercase mb-1">{customer.name}</h4>
                    <p className="font-medium mb-3">{formatPhone(customer.phone)}</p>
                    
                    <p className="font-bold text-xl uppercase underline">
                      {formatCityState(customer.tourCity, customer.tourState)}
                    </p>
                  </div>
                  
                  {/* Footer with logo */}
                  <div className="flex justify-end items-center p-3">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[#1C3553] flex items-center justify-center mb-1">
                        <p className="text-white font-bold text-sm">AF</p>
                      </div>
                      <p className="text-xs font-medium">@ANDRADEFLORASSESSORIA</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
            
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
                font-family: 'Montserrat', sans-serif;
              }
            }
          `}</style>
        </div>
      </PrintablePDF>
    );
  }
);

ShipmentCardsPDF.displayName = 'ShipmentCardsPDF';
