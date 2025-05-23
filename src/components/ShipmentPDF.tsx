
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Customer } from '@/lib/data';
import { PrintablePDF, PrintablePDFRef } from './PrintablePDF';

interface ShipmentPDFProps {
  shipmentCustomers: Customer[];
  date: Date;
}

// Global styles for all shipment PDFs
const PDFStyles = () => (
  <style type="text/css" className="pdf-styles hidden">
    {`
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
      
      @media print {
        body {
          margin: 0 !important;
          font-family: 'Poppins', sans-serif !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        .page-break-before {
          page-break-before: always !important;
        }
        
        .print-page-container {
          width: 210mm !important;
          min-height: 297mm !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }
        
        .shipment-table {
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
        }
        
        .shipment-table th,
        .shipment-table td {
          border: 1px solid black !important;
          padding: 8px !important;
          text-align: left !important;
        }
        
        .shipment-table th {
          background-color: #1C3553 !important;
          color: white !important;
          font-weight: bold !important;
          text-align: center !important;
        }
        
        .shipment-table td.text-right,
        .shipment-table th.text-right {
          text-align: right !important;
        }
        
        .shipment-table td.text-center,
        .shipment-table th.text-center {
          text-align: center !important;
        }
        
        .shipment-table tr.total-row {
          background-color: #f2f2f2 !important;
          font-weight: bold !important;
        }
        
        @page {
          margin: 0 !important;
          size: A4 !important;
        }
      }
    `}
  </style>
);

export const ShipmentTablePDF = React.forwardRef<PrintablePDFRef, ShipmentPDFProps>(
  ({ shipmentCustomers, date }, ref) => {
    const calculateServiceFee = (total: number) => Math.max(60, total * 0.1);
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const footerDate = format(date, "dd/MM/yy", { locale: ptBR });

    const totalOrderAmount = shipmentCustomers.reduce((sum, customer) => {
      const latestOrder = customer.orders?.reduce((latest, current) =>
        new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
      );
      return sum + (latestOrder?.total || 0);
    }, 0);

    const totalServiceFeeAmount = shipmentCustomers.reduce((sum, customer) => {
      const latestOrder = customer.orders?.reduce((latest, current) =>
        new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
      );
      return sum + calculateServiceFee(latestOrder?.total || 0);
    }, 0);

    const grandTotal = totalOrderAmount + totalServiceFeeAmount;

    return (
      <PrintablePDF ref={ref}>
        <PDFStyles />
        <div className="print-page-container bg-white text-black font-[Poppins] flex flex-col min-h-[297mm]">
          {/* Header */}
          <div className="bg-[#1C3553] text-white py-4 px-6 text-center">
            <h1 className="text-2xl font-bold">AF ASSESSORIA</h1>
            <p className="text-sm font-light tracking-wide">CONSULTORIA</p>
          </div>
          
          {/* Main content - Table */}
          <div className="flex-grow p-4 overflow-hidden">
            <table className="shipment-table w-full">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Nome</th>
                  <th style={{ width: '15%' }} className="text-right">Compra</th>
                  <th style={{ width: '15%' }} className="text-right">Serviço</th>
                  <th style={{ width: '15%' }} className="text-right">Emb.</th>
                  <th style={{ width: '15%' }} className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {shipmentCustomers.length > 0 ? shipmentCustomers.map((customer, idx) => {
                  const latestOrder = customer.orders?.reduce((latest, current) =>
                    new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                  );
                  const orderTotal = latestOrder?.total || 0;
                  const serviceFee = calculateServiceFee(orderTotal);
                  const total = orderTotal + serviceFee;

                  return (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-gray-100" : ""}>
                      <td>{`${idx + 1}. ${customer.name}`}</td>
                      <td className="text-right">{formatCurrency(orderTotal)}</td>
                      <td className="text-right">{formatCurrency(serviceFee)}</td>
                      <td className="text-right"></td>
                      <td className="text-right font-semibold">{formatCurrency(total)}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      Nenhum cliente para exibir.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="total-row bg-gray-200">
                  <td className="font-bold text-center">TOTAIS:</td>
                  <td className="text-right font-bold">{formatCurrency(totalOrderAmount)}</td>
                  <td className="text-right font-bold">{formatCurrency(totalServiceFeeAmount)}</td>
                  <td className="text-right font-bold">-</td>
                  <td className="text-right font-bold">{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Footer */}
          <div className="bg-[#1C3553] text-white p-3 flex justify-center space-x-8 text-xs text-center mt-auto">
            <div className="text-center">
              <div>🗓️</div>
              <div>{footerDate}</div>
            </div>
            <div className="text-center">
              <p>Santa Cruz do Capibaribe - PE</p>
            </div>
            <div className="text-center">
              <p>📞 (84) 9 9811-4515</p>
              <p>@ANDRADEFLORASSESSORIA</p>
            </div>
          </div>
        </div>
      </PrintablePDF>
    );
  }
);

// Implementing the ShipmentCardsPDF for showing personal and tour data
export const ShipmentCardsPDF = React.forwardRef<PrintablePDFRef, ShipmentPDFProps>(
  ({ shipmentCustomers, date }, ref) => {
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const footerDate = format(date, "dd/MM/yy", { locale: ptBR });

    // Split customers into pairs for two cards per page
    const customerPairs = [];
    for (let i = 0; i < shipmentCustomers.length; i += 2) {
      if (i + 1 < shipmentCustomers.length) {
        customerPairs.push([shipmentCustomers[i], shipmentCustomers[i + 1]]);
      } else {
        customerPairs.push([shipmentCustomers[i]]);
      }
    }

    // Função para formatar telefone
    const formatPhone = (phone: string) => {
      if (!phone) return "";
      const numbers = phone.replace(/\D/g, '');
      return numbers.length <= 10
        ? numbers.replace(/(\d{2})(\d{0,4})(\d{0,4})/, '($1) $2-$3')
        : numbers.replace(/(\d{2})(\d{0,5})(\d{0,4})/, '($1) $2-$3');
    };

    return (
      <PrintablePDF ref={ref}>
        <PDFStyles />
        
        {customerPairs.map((pair, pairIndex) => (
          <div key={pairIndex} className={pairIndex > 0 ? "page-break-before" : ""}>
            <div className="print-page-container bg-white flex flex-col">
              {/* Two cards per page with gap between them */}
              <div className="grid grid-cols-1 gap-4 p-8 flex-grow">
                {pair.map((customer, idx) => (
                  <div key={idx} className="border-2 border-[#1C3553] p-6 rounded font-montserrat flex flex-col h-[40vh] mb-6">
                    {/* Card Header */}
                    <div className="text-center mb-4">
                      <h2 className="text-4xl font-bold mb-2">AF ASSESSORIA</h2>
                      <p className="text-xl uppercase tracking-wide">CONSULTORIA</p>
                    </div>
                    
                    {/* Customer Information - FONTE AUMENTADA */}
                    <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                      <h3 className="text-4xl font-bold uppercase">{customer.name}</h3>
                      
                      <div className="flex flex-col space-y-2 text-2xl">
                        {/* Dados pessoais */}
                        <div className="text-center">
                          {customer.phone && (
                            <p className="font-medium">Telefone: {formatPhone(customer.phone)}</p>
                          )}
                          {customer.email && (
                            <p className="text-xl">{customer.email}</p>
                          )}
                        </div>
                        
                        {/* Dados da excursão */}
                        {(customer.tourName || customer.tourSeatNumber) && (
                          <div className="border-t border-gray-300 pt-3 mt-2">
                            {customer.tourName && (
                              <p className="font-bold text-2xl">{customer.tourName}</p>
                            )}
                            {customer.tourSector && (
                              <p className="text-xl">Setor: {customer.tourSector}</p>
                            )}
                            {customer.tourSeatNumber && (
                              <p className="font-bold text-3xl">Vaga: {customer.tourSeatNumber}</p>
                            )}
                            {(customer.tourCity || customer.tourState) && (
                              <p className="text-xl">{customer.tourCity}{customer.tourCity && customer.tourState ? ' - ' : ''}{customer.tourState}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Card Footer */}
                    <div className="text-center mt-4 text-xl">
                      <p className="font-bold">{footerDate} • Santa Cruz do Capibaribe - PE</p>
                      <p>📞 (84) 9 9811-4515 • @ANDRADEFLORASSESSORIA</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </PrintablePDF>
    );
  }
);

ShipmentTablePDF.displayName = 'ShipmentTablePDF';
ShipmentCardsPDF.displayName = 'ShipmentCardsPDF';
