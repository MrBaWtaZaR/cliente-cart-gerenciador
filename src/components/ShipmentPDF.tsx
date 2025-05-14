import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Customer } from '@/lib/data'; // Presumo que a definição de Customer e Order permaneça a mesma
import { PrintablePDF, PrintablePDFRef } from './PrintablePDF'; // Presumo que este componente não mude

interface ShipmentPDFProps {
  shipmentCustomers: Customer[];
  date: Date;
}

// Estilos CSS como string para dangerouslySetInnerHTML
// Se o CSS ainda aparecer no PDF, considere mover estas regras para um arquivo CSS global.
const globalPrintStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
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
    .print-page-container { /* Classe para o container de cada página A4 */
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      box-sizing: border-box !important;
      overflow: hidden; /* Para evitar que conteúdo extra cause problemas */
    }
    @page {
      margin: 0 !important;
      size: A4 !important;
    }
  }
`;

export const ShipmentTablePDF = React.forwardRef<PrintablePDFRef, ShipmentPDFProps>(
  ({ shipmentCustomers, date }, ref) => {
    const calculateServiceFee = (total: number) => {
      return Math.max(60, total * 0.1);
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const footerDate = format(date, "dd/MM/yy", { locale: ptBR });

    const totalOrderAmount = shipmentCustomers.reduce((sum, customer) => {
        const latestOrder = customer.orders && customer.orders.length > 0
            ? customer.orders.reduce((latest, current) =>
                new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
              ) : null;
        return sum + (latestOrder?.total || 0);
    }, 0);

    const totalServiceFeeAmount = shipmentCustomers.reduce((sum, customer) => {
        const latestOrder = customer.orders && customer.orders.length > 0
            ? customer.orders.reduce((latest, current) =>
                new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
              ) : null;
        return sum + calculateServiceFee(latestOrder?.total || 0);
    }, 0);

    const grandTotal = totalOrderAmount + totalServiceFeeAmount;

    return (
      <PrintablePDF ref={ref}>
        {/* Inject styles, if this still causes issues, move to global CSS */}
        <style dangerouslySetInnerHTML={{ __html: globalPrintStyles }} />
        <div className="print-page-container bg-white text-black font-[Poppins]">
          {/* Header */}
          <div className="bg-[#1C3553] text-white py-4 px-6 text-center">
            <h1 className="text-2xl font-bold tracking-wider">AF ASSESSORIA</h1>
            <p className="text-md font-light">CONSULTORIA</p>
          </div>

          {/* Conteúdo Principal (Tabela) */}
          <div className="flex-grow p-4 overflow-auto"> {/* overflow-auto se a tabela for muito grande */}
            <div className="border border-black">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1C3553] text-white">
                    <th className="py-3 px-4 text-center font-bold uppercase text-sm tracking-wider border-b border-r border-black">Nome</th>
                    <th className="py-3 px-4 text-center font-bold uppercase text-sm tracking-wider border-b border-r border-black">V. da Compra</th>
                    <th className="py-3 px-4 text-center font-bold uppercase text-sm tracking-wider border-b border-r border-black">10% Serviço</th>
                    <th className="py-3 px-4 text-center font-bold uppercase text-sm tracking-wider border-b border-r border-black">Taxa Emb.</th>
                    <th className="py-3 px-4 text-center font-bold uppercase text-sm tracking-wider border-b border-black">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {shipmentCustomers.length > 0 ? shipmentCustomers.map((customer, idx) => {
                    const latestOrder = customer.orders && customer.orders.length > 0
                      ? customer.orders.reduce((latest, current) =>
                        new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                      )
                      : null;

                    const orderTotal = latestOrder?.total || 0;
                    const serviceFee = calculateServiceFee(orderTotal);
                    const total = orderTotal + serviceFee;

                    return (
                      <tr key={idx} className="bg-white even:bg-gray-50">
                        <td className="py-3 px-4 border-b border-r border-black text-left text-sm">{`${idx + 1}. ${customer.name}`}</td>
                        <td className="py-3 px-4 border-b border-r border-black text-right text-sm">{formatCurrency(orderTotal)}</td>
                        <td className="py-3 px-4 border-b border-r border-black text-right text-sm">{formatCurrency(serviceFee)}</td>
                        <td className="py-3 px-4 border-b border-r border-black text-right text-sm min-h-[2.5rem]"></td>
                        <td className="py-3 px-4 border-b border-black text-right text-sm font-semibold">{formatCurrency(total)}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                        <td colSpan={5} className="py-10 px-4 text-center text-gray-500 text-sm border-b border-black">
                            Nenhum cliente para exibir.
                        </td>
                    </tr>
                  )}
                </tbody>
                {/* Rodapé da Tabela com Totais */}
                <tfoot>
                  <tr className="bg-gray-100 font-bold text-sm">
                    <td className="py-3 px-4 border-t border-r border-black text-left">TOTAIS:</td>
                    <td className="py-3 px-4 border-t border-r border-black text-right">{formatCurrency(totalOrderAmount)}</td>
                    <td className="py-3 px-4 border-t border-r border-black text-right">{formatCurrency(totalServiceFeeAmount)}</td>
                    <td className="py-3 px-4 border-t border-r border-black text-right">-</td> {/* Taxa de embarque manual */}
                    <td className="py-3 px-4 border-t border-black text-right">{formatCurrency(grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Rodapé da Página */}
          <div className="bg-[#1C3553] text-white p-3 flex justify-between items-center mt-auto">
            <div className="flex flex-col items-center">
              <span className="text-xl">🗓️</span>
              <span className="text-xs font-semibold">{footerDate}</span>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase">Santa Cruz do Capibaribe - PE</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold">📞 (84) 9 9811-4515</p>
              <p className="text-xs font-semibold">@ANDRADEFLORASSESSORIA</p>
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
      if (!phone) return '';
      const numbers = phone.replace(/\D/g, '');
      if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{0,4})(\d{0,4})/, '($1) $2-$3');
      } else {
        return numbers.replace(/(\d{2})(\d{0,5})(\d{0,4})/, '($1) $2-$3');
      }
    };

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

    const customerPairs = [];
    for (let i = 0; i < shipmentCustomers.length; i += 2) {
      customerPairs.push(shipmentCustomers.slice(i, i + 2));
    }

    // Margem da página e gap entre os cards em mm
    const pageMarginMm = 8; 
    const cardGapMm = 8;

    return (
      <PrintablePDF ref={ref}>
        {/* Inject styles, if this still causes issues, move to global CSS */}
        <style dangerouslySetInnerHTML={{ __html: globalPrintStyles }} />
        <div className="bg-white font-[Poppins] text-black">
          {customerPairs.map((pair, pairIndex) => (
            <div
              key={pairIndex}
              className={`print-page-container ${pairIndex > 0 ? 'page-break-before' : ''} 
                          flex flex-row flex-wrap items-start justify-start content-start`}
              style={{ 
                padding: `${pageMarginMm}mm`, 
                gap: `${cardGapMm}mm`,
                boxSizing: 'border-box' // Garante que padding e border não aumentem o tamanho total
              }}
            >
              {pair.map((customer, idx) => (
                <div
                  key={idx}
                  className="flex flex-col bg-white border-2 border-gray-700 rounded-lg shadow-md overflow-hidden p-4 box-border"
                  style={{
                    // Largura: (LarguraA4 - 2*MargemPagina - GapEntreCards) / 2
                    // LarguraA4 = 210mm
                    width: `calc((100% - ${cardGapMm}mm) / 2)`, // Ocupa 50% do espaço útil menos o gap
                    minHeight: "120mm", // Altura mínima, ajuste conforme necessário
                    maxHeight: "135mm",
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Header do Card */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-500">VOLUME</p>
                      <p className="text-xl font-bold text-gray-800">01</p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-extrabold text-2xl uppercase text-gray-800 tracking-wide">*EXCURSÃO*</h3>
                      <p className="text-base font-semibold text-[#1C3553]">{customer.tourName || "NOME EXCURSÃO"}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-1 text-right">{customer.tourDepartureTime || "--:--"}</div>
                  <p className="text-sm text-gray-500 mb-2">{customer.additionalInfo || "Informação Adicional"}</p>
                  <p className="text-base text-gray-700 mb-4">
                      <span className="font-semibold">Setor:</span> {customer.tourSector || "-"} / <span className="font-semibold">Vaga:</span> {customer.tourSeatNumber || "-"}
                  </p>

                  {/* Linha Separadora */}
                  <div className="w-full h-px bg-gray-400 my-3"></div>

                  {/* Cliente section */}
                  <div className="flex flex-col flex-grow items-center">
                    <h3 className="font-extrabold text-2xl uppercase text-gray-800 tracking-wide mb-2 text-center">*CLIENTE*</h3>
                    <h4 className="font-bold text-xl uppercase leading-tight text-center text-[#1C3553] mb-2">{customer.name}</h4>
                    <p className="text-lg text-gray-700 text-center mb-3">{formatPhone(customer.phone)}</p>
                    <p className="font-bold text-xl uppercase underline decoration-2 underline-offset-2 text-center text-gray-800">
                      {formatCityState(customer.tourCity, customer.tourState)}
                    </p>
                  </div>
                  
                  {/* Rodapé do Card */}
                  <div className="mt-auto pt-4 text-center">
                    <p className="text-base font-bold text-[#1C3553]">AF ASSESSORIA</p>
                    <p className="text-sm text-gray-600">@ANDRADEFLORASSESSORIA</p>
                  </div>
                </div>
              ))}
              {/* Placeholder para alinhar o primeiro card se houver apenas um no par */}
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