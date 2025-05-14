import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Customer } from '@/lib/data';
import { PrintablePDF, PrintablePDFRef } from './PrintablePDF';

interface ShipmentPDFProps {
  shipmentCustomers: Customer[];
  date: Date;
}

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
    // Supondo que a taxa de embarque seja um valor fixo ou venha do cliente/pedido
    // Para este exemplo, vou assumir que é um campo a ser preenchido ou um valor fixo por cliente, se disponível.
    // No entanto, a solicitação é para que a coluna fique em branco para preenchimento manual.

    return (
      <PrintablePDF ref={ref} className="shipment-table-print-container">
        <div className="bg-white max-w-4xl mx-auto text-black print:w-full print:max-w-none font-[Poppins]">
          {/* Header com Logo Centralizado */}
          <div className="flex justify-center items-center py-3 bg-[#1C3553]">
            <div className="w-20 h-20 bg-[#1C3553] rounded-full flex flex-col items-center justify-center border-2 border-white">
              <span className="text-white text-[10px] font-medium">ASSESSORIA</span>
              <span className="text-white text-3xl font-bold">AF</span>
              <span className="text-white text-[10px] font-medium">CONSULTORIA</span>
            </div>
          </div>

          {/* Tabela de Clientes */}
          <div className="px-4 pb-4 pt-3">
            <div className="overflow-hidden border border-black">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1C3553] text-white">
                    <th className="py-2 px-3 text-center font-bold border-b border-r border-black uppercase text-sm">Nome</th>
                    <th className="py-2 px-3 text-center font-bold border-b border-r border-black uppercase text-sm">V. da Compra</th>
                    <th className="py-2 px-3 text-center font-bold border-b border-r border-black uppercase text-sm">10% Serviço</th>
                    <th className="py-2 px-3 text-center font-bold border-b border-r border-black uppercase text-sm">Taxa Emb.</th>
                    <th className="py-2 px-3 text-center font-bold border-b border-black uppercase text-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {shipmentCustomers.map((customer, idx) => {
                    const latestOrder = customer.orders && customer.orders.length > 0
                      ? customer.orders.reduce((latest, current) =>
                        new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                      )
                      : null;

                    const orderTotal = latestOrder?.total || 0;
                    const serviceFee = calculateServiceFee(orderTotal);
                    // A coluna Taxa Emb. será deixada em branco para preenchimento manual
                    // O total não incluirá a taxa de embarque nos cálculos automáticos aqui.
                    const total = orderTotal + serviceFee;

                    return (
                      <tr key={idx} className="bg-white"> {/* Fundo branco para as linhas */}
                        <td className="py-2 px-3 border-b border-r border-black text-left text-sm">{`${idx + 1}. ${customer.name}`}</td>
                        <td className="py-2 px-3 border-b border-r border-black text-right text-sm">{formatCurrency(orderTotal)}</td>
                        <td className="py-2 px-3 border-b border-r border-black text-right text-sm">{formatCurrency(serviceFee)}</td>
                        <td className="py-2 px-3 border-b border-r border-black text-right text-sm h-10"></td> {/* Célula vazia para Taxa Emb. */}
                        <td className="py-2 px-3 border-b border-black text-right text-sm font-semibold">{formatCurrency(total)}</td>
                      </tr>
                    );
                  })}
                  {/* Linhas vazias para preenchimento manual, se necessário */}
                  {Array.from({ length: Math.max(0, 12 - shipmentCustomers.length) }).map((_, i) => ( // Ajustado para 12 linhas de exemplo
                    <tr key={`empty-${i}`} className="bg-white">
                      <td className="py-2 px-3 border-b border-r border-black h-10 text-sm"></td>
                      <td className="py-2 px-3 border-b border-r border-black text-sm"></td>
                      <td className="py-2 px-3 border-b border-r border-black text-sm"></td>
                      <td className="py-2 px-3 border-b border-r border-black text-sm"></td>
                      <td className="py-2 px-3 border-b border-black text-sm"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rodapé do Documento */}
          <div className="bg-[#1C3553] text-white p-3 flex justify-between items-center mt-auto">
            <div className="flex flex-col items-center">
              <span className="text-xl">🗓️</span>
              <span className="text-xs font-semibold">{footerDate}</span>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold">SANTA CRUZ DO CAPIBARIBE - PE</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold">📞 (84) 9 9811-4515</p>
              <p className="text-xs font-semibold">@ANDRADEFLORASSESSORIA</p>
            </div>
          </div>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
            @media print {
              body {
                margin: 0;
                font-family: 'Poppins', sans-serif;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .page-break-before { page-break-before: always; }
              .shipment-table-print-container { margin: 0; padding: 0; }
              @page { margin: 0; size: A4; }
            }
          `}</style>
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

    return (
      <PrintablePDF ref={ref} className="shipment-cards-print-container">
        {/* Ajuste de padding da página e gap entre os cards para melhor aproveitamento */}
        <div className="bg-transparent mx-auto text-black font-[Poppins]">
          {customerPairs.map((pair, pairIndex) => (
            <div
              key={pairIndex}
              className={`flex flex-row flex-wrap justify-center items-start gap-x-4 gap-y-6 ${pairIndex > 0 ? 'page-break-before' : ''}`}
              // Usar flex-row para colocar lado a lado, e flex-wrap para caso não caibam.
              // Ajuste de padding da página para dar alguma margem, mas permitir que os cards ocupem mais espaço.
              style={{ minHeight: "290mm", width:"210mm", padding: "8mm" }} // Altura mínima para A4, padding menor
            >
              {pair.map((customer, idx) => (
                <div
                  key={idx}
                  // Ajuste as dimensões do card: aprox. 9cm de largura x 13cm de altura
                  // 1mm ~ 3.78px. Width: ~90mm, Height: ~130mm.
                  // Tailwind: w-[90mm] h-[130mm] não funciona diretamente. Usar style ou classes aproximadas.
                  // Ex: w-[340px] h-[490px] -> pode ser muito grande.
                  // Vamos tentar com classes de fração da largura disponível ou w-[calc(50%-1rem)] se usar gap
                  className="w-[calc(50%_-_0.5rem)] max-w-[95mm] min-h-[130mm] border-2 border-black rounded-xl flex flex-col bg-white relative overflow-hidden p-3 shadow-lg"
                  // Usando w-[calc(50%_-_0.5rem)] para ocupar quase metade com um pequeno espaço (0.5rem do gap-x-4)
                >
                  {/* Volume indicator */}
                  <div className="absolute top-2.5 left-2.5 w-11 h-11 rounded-full bg-black flex flex-col items-center justify-center border border-white shadow-md">
                    <span className="text-white font-semibold text-[10px] -mb-0.5">Vol.</span>
                    <span className="text-white font-bold text-base">01</span>
                  </div>

                  {/* Excursão section */}
                  <div className="flex flex-col items-center text-center pt-3 mt-4">
                    <h3 className="font-extrabold text-lg uppercase mb-1 tracking-wide">*EXCURSÃO*</h3>
                    <div className="relative w-full mb-1">
                        <h4 className="font-bold text-base uppercase text-gray-800">{customer.tourName || "NOME EXCURSÃO"}</h4>
                        <p className="absolute top-0 right-0 text-xs font-semibold text-gray-700">{customer.tourDepartureTime || "--:--"}</p>
                    </div>
                    <p className="text-xs text-gray-600">{customer.additionalInfo || "Informação Adicional"}</p>
                    <p className="text-xs mt-1 text-gray-700">
                        <span className="font-semibold">Setor:</span> {customer.tourSector || "-"} / <span className="font-semibold">Vaga:</span> {customer.tourSeatNumber || "-"}
                    </p>
                  </div>

                  {/* Separating line */}
                  <div className="w-full h-0.5 bg-gray-800 my-2.5 rounded"></div>

                  {/* Cliente section */}
                  <div className="flex flex-col items-center text-center flex-grow relative">
                    <h3 className="font-extrabold text-lg uppercase mb-1 tracking-wide">*CLIENTE*</h3>
                    <h4 className="font-bold text-base uppercase leading-tight text-gray-800">{customer.name}</h4>
                    <p className="text-sm my-1.5 text-gray-700">{formatPhone(customer.phone)}</p>
                    <p className="font-bold text-base uppercase underline decoration-2 underline-offset-2 text-gray-800">
                      {formatCityState(customer.tourCity, customer.tourState)}
                    </p>

                    {/* Footer with logo AF */}
                    <div className="absolute bottom-1.5 right-1.5 w-16 h-16 rounded-full bg-[#1C3553] flex flex-col items-center justify-center text-white p-1 shadow-md">
                        <span className="text-[8px] leading-tight font-medium tracking-tighter">(84)99811-4515</span>
                        <span className="font-extrabold text-xl leading-none">AF</span>
                        <span className="text-[7px] leading-tight font-medium tracking-tighter text-center">@ANDRADEFLOR<br/>ASSESSORIA</span>
                    </div>
                  </div>
                </div>
              ))}
               {/* Para garantir que a página tenha altura mesmo com 1 card */}
              {pair.length === 1 && (
                 <div className="w-[calc(50%_-_0.5rem)] max-w-[95mm]"></div> // Placeholder para alinhar se for 1 item
              )}
            </div>
          ))}
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
            
            @media print {
              body {
                margin: 0;
                font-family: 'Poppins', sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .page-break-before {
                page-break-before: always !important;
              }
              .shipment-cards-print-container {
                margin: 0 !important;
                padding: 0 !important;
              }
              @page {
                margin: 0mm !important; /* Reduzir margens da página de impressão */
                size: A4 !important;
              }
            }
          `}</style>
        </div>
      </PrintablePDF>
    );
  }
);

ShipmentCardsPDF.displayName = 'ShipmentCardsPDF';