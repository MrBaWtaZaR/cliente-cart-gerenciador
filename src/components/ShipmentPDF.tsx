
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Customer } from '@/lib/data';
import { PrintablePDF, PrintablePDFRef } from './PrintablePDF';

interface ShipmentPDFProps {
  shipmentCustomers: Customer[];
  date: Date;
}

const globalPrintStyles = `
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
      height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      box-sizing: border-box !important;
      overflow: hidden;
    }
    @page {
      margin: 0 !important;
      size: A4 !important;
    }
  }
`;

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
        <style>{globalPrintStyles}</style>
        <div className="print-page-container bg-white text-black font-[Poppins]">
          <div className="bg-[#1C3553] text-white py-4 px-6 text-center">
            <h1 className="text-2xl font-bold">AF ASSESSORIA</h1>
            <p className="text-sm font-light tracking-wide">CONSULTORIA</p>
          </div>
          <div className="flex-grow p-4 overflow-auto">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-[#1C3553] text-white">
                  <th className="py-2 px-3 border border-black">Nome</th>
                  <th className="py-2 px-3 border border-black">Compra</th>
                  <th className="py-2 px-3 border border-black">Serviço</th>
                  <th className="py-2 px-3 border border-black">Emb.</th>
                  <th className="py-2 px-3 border border-black">Total</th>
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
                    <tr key={idx} className="even:bg-gray-100">
                      <td className="py-2 px-3 border border-black text-left">{`${idx + 1}. ${customer.name}`}</td>
                      <td className="py-2 px-3 border border-black text-right">{formatCurrency(orderTotal)}</td>
                      <td className="py-2 px-3 border border-black text-right">{formatCurrency(serviceFee)}</td>
                      <td className="py-2 px-3 border border-black text-right"></td>
                      <td className="py-2 px-3 border border-black text-right font-semibold">{formatCurrency(total)}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="py-6 px-4 text-center text-gray-500 border border-black">Nenhum cliente para exibir.</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 font-bold">
                  <td className="py-2 px-3 border border-black text-left">TOTAIS:</td>
                  <td className="py-2 px-3 border border-black text-right">{formatCurrency(totalOrderAmount)}</td>
                  <td className="py-2 px-3 border border-black text-right">{formatCurrency(totalServiceFeeAmount)}</td>
                  <td className="py-2 px-3 border border-black text-right">-</td>
                  <td className="py-2 px-3 border border-black text-right">{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="bg-[#1C3553] text-white p-3 flex justify-between text-xs">
            <div className="text-center">
              <div>🗓️</div>
              <div>{footerDate}</div>
            </div>
            <div className="text-center">
              <p>Santa Cruz do Capibaribe - PE</p>
            </div>
            <div className="text-right">
              <p>📞 (84) 9 9811-4515</p>
              <p>@ANDRADEFLORASSESSORIA</p>
            </div>
          </div>
        </div>
      </PrintablePDF>
    );
  }
);

// Now implementing the missing ShipmentCardsPDF component
export const ShipmentCardsPDF = React.forwardRef<PrintablePDFRef, ShipmentPDFProps>(
  ({ shipmentCustomers, date }, ref) => {
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const footerDate = format(date, "dd/MM/yy", { locale: ptBR });
    const calculateServiceFee = (total: number) => Math.max(60, total * 0.1);

    // Split customers into pairs for two cards per page
    const customerPairs = [];
    for (let i = 0; i < shipmentCustomers.length; i += 2) {
      if (i + 1 < shipmentCustomers.length) {
        customerPairs.push([shipmentCustomers[i], shipmentCustomers[i + 1]]);
      } else {
        customerPairs.push([shipmentCustomers[i]]);
      }
    }

    return (
      <PrintablePDF ref={ref}>
        <style>{globalPrintStyles}</style>
        
        {customerPairs.map((pair, pairIndex) => (
          <div key={pairIndex} className={pairIndex > 0 ? "page-break-before" : ""}>
            <div className="print-page-container bg-white flex flex-col">
              {/* Two cards per page */}
              <div className="grid grid-cols-1 gap-6 p-8 flex-grow">
                {pair.map((customer, idx) => {
                  const latestOrder = customer.orders?.reduce((latest, current) =>
                    new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                  );
                  const orderTotal = latestOrder?.total || 0;
                  const serviceFee = calculateServiceFee(orderTotal);
                  const total = orderTotal + serviceFee;

                  return (
                    <div key={idx} className="border-2 border-[#1C3553] p-6 rounded font-montserrat flex flex-col h-[40vh]">
                      {/* Card Header */}
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold mb-2">AF ASSESSORIA</h2>
                        <p className="text-sm uppercase tracking-wide">CONSULTORIA</p>
                      </div>
                      
                      {/* Customer Information */}
                      <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                        <h3 className="text-2xl font-bold uppercase">{customer.name}</h3>
                        
                        <div className="flex flex-col space-y-2">
                          <div className="font-bold text-xl">
                            Compra: <span>{formatCurrency(orderTotal)}</span>
                          </div>
                          <div className="font-bold text-xl">
                            Serviço: <span>{formatCurrency(serviceFee)}</span>
                          </div>
                          <div className="font-bold text-xl border-t border-black pt-2 mt-2">
                            Total: <span>{formatCurrency(total)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Card Footer */}
                      <div className="text-center mt-6 text-sm">
                        <p className="font-bold">{footerDate} • Santa Cruz do Capibaribe - PE</p>
                        <p>📞 (84) 9 9811-4515 • @ANDRADEFLORASSESSORIA</p>
                      </div>
                    </div>
                  );
                })}
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

