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
const globalPrintStyles = `
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
    .print-container { /* Classe genérica para os containers principais dos PDFs */
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm; /* Largura A4 */
      height: 297mm; /* Altura A4 */
      display: flex;
      flex-direction: column;
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

    return (
      <PrintablePDF ref={ref}>
        <style dangerouslySetInnerHTML={{ __html: globalPrintStyles }} />
        <div className="print-container bg-white text-black font-[Poppins]"> {/* Usando print-container para A4 */}
          {/* Header */}
          <div className="bg-[#1C3553] text-white py-4 px-6 text-center">
            <h1 className="text-2xl font-bold tracking-wider">AF ASSESSORIA</h1>
            <p className="text-md font-light">CONSULTORIA</p>
          </div>

          {/* Conteúdo Principal (Tabela) - permite crescer */}
          <div className="flex-grow p-4"> {/* p-4 para margem interna da tabela */}
            <div className="overflow-hidden border border-black">
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
                      <tr key={idx} className="bg-white even:bg-gray-50"> {/* Alterna cor de fundo levemente */}
                        <td className="py-3 px-4 border-b border-r border-black text-left text-sm">{`${idx + 1}. ${customer.name}`}</td>
                        <td className="py-3 px-4 border-b border-r border-black text-right text-sm">{formatCurrency(orderTotal)}</td>
                        <td className="py-3 px-4 border-b border-r border-black text-right text-sm">{formatCurrency(serviceFee)}</td>
                        <td className="py-3 px-4 border-b border-r border-black text-right text-sm min-h-[2.5rem]"></td> {/* Célula vazia com altura mínima */}
                        <td className="py-3 px-4 border-b border-black text-right text-sm font-semibold">{formatCurrency(total)}</td>
                      </tr>
                    );
                  }) : (
                    // Linha de placeholder se não houver clientes, para manter a estrutura da tabela
                    <tr>
                        <td colSpan={5} className="py-10 px-4 text-center text-gray-500 text-sm border-b border-black">
                            Nenhum cliente para exibir.
                        </td>
                    </tr>
                  )}
                  {/* Não adicionar mais linhas vazias fixas, a tabela crescerá com o conteúdo */}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rodapé Fixo */}
          <div className="bg-[#1C3553] text-white p-3 flex justify-between items-center mt-auto"> {/* mt-auto empurra para o final se houver espaço */}
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

    return (
      <PrintablePDF ref={ref}>
        <style dangerouslySetInnerHTML={{ __html: globalPrintStyles }} />
        <div className="bg-white font-[Poppins] text-black"> {/* bg-white para a página inteira se necessário */}
          {customerPairs.map((pair, pairIndex) => (
            <div
              key={pairIndex}
              // Container para cada par de cards (página A4)
              // Usando print-container indiretamente via @page, mas definindo altura aqui para layout
              className={`flex flex-row flex-wrap items-start justify-center 
                          ${pairIndex > 0 ? 'page-break-before' : ''} 
                          p-[10mm] box-border`} // Padding para margens da página
              style={{ width: "210mm", minHeight: "297mm", gap: "10mm" }} // Gap entre os cards
            >
              {pair.map((customer, idx) => (
                <div
                  key={idx}
                  // Cada card ocupa aproximadamente metade da largura menos o gap, com altura definida
                  className="flex flex-col bg-white border-2 border-gray-800 rounded-lg shadow-lg overflow-hidden p-4 box-border"
                  style={{ 
                    width: "calc(50% - 5mm)", // 50% da largura do container menos metade do gap
                    minHeight: "125mm", // Altura mínima do card
                    maxWidth: "90mm" // Largura máxima do card
                  }}
                >
                  {/* Header do Card (Volume e Nome Excursão) */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-600">VOLUME</p>
                      <p className="text-lg font-bold text-gray-800">01</p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-extrabold text-xl uppercase text-gray-800 tracking-wide">*EXCURSÃO*</h3>
                      <p className="text-sm font-semibold text-[#1C3553]">{customer.tourName || "NOME EXCURSÃO"}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-1 text-right">{customer.tourDepartureTime || "--:--"}</div>
                  <p className="text-xs text-gray-500 mb-1">{customer.additionalInfo || "Informação Adicional"}</p>
                  <p className="text-sm text-gray-700 mb-3">
                      <span className="font-semibold">Setor:</span> {customer.tourSector || "-"} / <span className="font-semibold">Vaga:</span> {customer.tourSeatNumber || "-"}
                  </p>


                  {/* Linha Separadora */}
                  <div className="w-full h-px bg-gray-400 my-3"></div>

                  {/* Cliente section */}
                  <div className="flex flex-col flex-grow"> {/* flex-grow para empurrar rodapé do card para baixo */}
                    <h3 className="font-extrabold text-xl uppercase text-gray-800 tracking-wide mb-1 text-center">*CLIENTE*</h3>
                    <h4 className="font-bold text-lg uppercase leading-tight text-center text-[#1C3553] mb-1">{customer.name}</h4>
                    <p className="text-base text-gray-700 text-center mb-2">{formatPhone(customer.phone)}</p>
                    <p className="font-bold text-lg uppercase underline decoration-2 underline-offset-2 text-center text-gray-800">
                      {formatCityState(customer.tourCity, customer.tourState)}
                    </p>
                  </div>
                  
                  {/* Rodapé do Card (AF Assessoria) */}
                  <div className="mt-auto pt-3 text-center">
                    <p className="text-sm font-bold text-[#1C3553]">AF ASSESSORIA</p>
                    <p className="text-xs text-gray-600">@ANDRADEFLORASSESSORIA</p>
                  </div>
                </div>
              ))}
               {/* Placeholder se houver apenas um card para manter o layout com flexbox */}
              {pair.length === 1 && (
                 <div style={{ width: "calc(50% - 5mm)", maxWidth: "90mm" }} aria-hidden="true"></div>
              )}
            </div>
          ))}
        </div>
      </PrintablePDF>
    );
  }
);

ShipmentCardsPDF.displayName = 'ShipmentCardsPDF';