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
        <style dangerouslySetInnerHTML={{ __html: globalPrintStyles }} />
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

ShipmentTablePDF.displayName = 'ShipmentTablePDF';

export const ShipmentCardsPDF = React.forwardRef<PrintablePDFRef, ShipmentPDFProps>(
  ({ shipmentCustomers, date }, ref) => {
    const formatPhone = (phone: string) => {
      const numbers = phone?.replace(/\D/g, '') || '';
      return numbers.length <= 10
        ? numbers.replace(/(\d{2})(\d{0,4})(\d{0,4})/, '($1) $2-$3')
        : numbers.replace(/(\d{2})(\d{0,5})(\d{0,4})/, '($1) $2-$3');
    };

    const formatCityState = (city?: string, state?: string) => {
      if (city && state) return `${city.toUpperCase()} - ${state.toUpperCase()}`;
      if (city) return city.toUpperCase();
      if (state) return state.toUpperCase();
      return '-';
    };

    const customerPairs = [];
    for (let i = 0; i < shipmentCustomers.length; i += 2) {
      customerPairs.push(shipmentCustomers.slice(i, i + 2));
    }

    const pageMarginMm = 8;
    const cardGapMm = 8;

    return (
      <PrintablePDF ref={ref}>
        <style dangerouslySetInnerHTML={{ __html: globalPrintStyles }} />
        <div className="bg-white font-[Poppins] text-black">
          {customerPairs.map((pair, pairIndex) => (
            <div
              key={pairIndex}
              className={`print-page-container ${pairIndex > 0 ? 'page-break-before' : ''} flex flex-wrap items-start`}
              style={{
                padding: `${pageMarginMm}mm`,
                gap: `${cardGapMm}mm`,
              }}
            >
              {pair.map((customer, idx) => (
                <div
                  key={idx}
                  className="flex flex-col border border-gray-700 rounded-md shadow p-4"
                  style={{
                    width: `calc((100% - ${cardGapMm}mm) / 2)`,
                    minHeight: "120mm",
                    maxHeight: "135mm",
                    boxSizing: 'border-box'
                  }}
                >
                  <div className="flex justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">VOLUME</p>
                      <p className="text-xl font-bold text-gray-800">01</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg uppercase text-gray-800">EXCURSÃO</p>
                      <p className="text-sm font-semibold text-[#1C3553]">{customer.tourName || "NOME EXCURSÃO"}</p>
                    </div>
                  </div>
                  <div className="text-xs text-right text-gray-500 mb-1">{customer.tourDepartureTime || "--:--"}</div>
                  <p className="text-sm text-gray-600 mb-2">{customer.additionalInfo || "Informação Adicional"}</p>
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Setor:</strong> {customer.tourSector || "-"} / <strong>Vaga:</strong> {customer.tourSeatNumber || "-"}
                  </p>
                  <div className="w-full h-px bg-gray-300 my-2" />
                  <div className="flex flex-col items-center text-center">
                    <p className="font-bold text-lg text-gray-800 uppercase">CLIENTE</p>
                    <h4 className="font-bold text-xl text-[#1C3553] uppercase">{customer.name}</h4>
                    <p className="text-base text-gray-700 mt-1">{formatPhone(customer.phone)}</p>
                    <p className="font-bold text-base mt-2 underline decoration-2 underline-offset-2">{formatCityState(customer.tourCity, customer.tourState)}</p>
                  </div>
                  <div className="mt-auto pt-4 text-center">
                    <p className="text-base font-bold text-[#1C3553]">AF ASSESSORIA</p>
                    <p className="text-xs text-gray-500">@ANDRADEFLORASSESSORIA</p>
                  </div>
                </div>
              ))}
              {pair.length === 1 && (
                <div style={{ width: `calc((100% - ${cardGapMm}mm) / 2)` }} aria-hidden="true"></div>
              )}
            </div>
          ))}
        </div>
      </PrintablePDF>
    );
  }
);

ShipmentCardsPDF.displayName = 'ShipmentCardsPDF';
