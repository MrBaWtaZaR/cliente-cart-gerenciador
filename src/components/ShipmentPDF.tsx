
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Customer } from '@/lib/data';
import { PrintablePDF, PrintablePDFRef } from './PrintablePDF';
import { PDFStyles } from './pdf/PDFStyles';
import { PDFHeader } from './pdf/PDFHeader';
import { PDFFooter } from './pdf/PDFFooter';
import { calculateServiceFee, formatCurrency, formatPhone } from '@/utils/pdfHelpers';

interface ShipmentPDFProps {
  shipmentCustomers: Customer[];
  date: Date;
}

export const ShipmentTablePDF = React.forwardRef<PrintablePDFRef, ShipmentPDFProps>(
  ({ shipmentCustomers, date }, ref) => {
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
          <PDFHeader />
          
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
          
          <PDFFooter date={footerDate} />
        </div>
      </PrintablePDF>
    );
  }
);

export const ShipmentCardsPDF = React.forwardRef<PrintablePDFRef, ShipmentPDFProps>(
  ({ shipmentCustomers, date }, ref) => {
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

    return (
      <PrintablePDF ref={ref}>
        <PDFStyles />
        
        {customerPairs.map((pair, pairIndex) => (
          <div key={pairIndex} className={pairIndex > 0 ? "page-break-before" : ""}>
            <div className="print-page-container bg-white flex flex-col">
              <div className="grid grid-cols-1 gap-4 p-8 flex-grow">
                {pair.map((customer, idx) => (
                  <div key={idx} className="border-2 border-[#1C3553] p-6 rounded font-montserrat flex flex-col h-[40vh] mb-6">
                    <div className="text-center mb-4">
                      <h2 className="text-4xl font-bold mb-2">AF ASSESSORIA</h2>
                      <p className="text-xl uppercase tracking-wide">CONSULTORIA</p>
                    </div>
                    
                    <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                      <h3 className="text-4xl font-bold uppercase">{customer.name}</h3>
                      
                      <div className="flex flex-col space-y-2 text-2xl">
                        <div className="text-center">
                          {customer.phone && (
                            <p className="font-medium">Telefone: {formatPhone(customer.phone)}</p>
                          )}
                          {customer.email && (
                            <p className="text-xl">{customer.email}</p>
                          )}
                        </div>
                        
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
