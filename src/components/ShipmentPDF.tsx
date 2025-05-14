import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Customer } from '@/lib/data'; // Presumo que a definição de Customer e Order permaneça a mesma
import { PrintablePDF, PrintablePDFRef } from './PrintablePDF'; // Presumo que este componente não mude

interface ShipmentPDFProps {
  shipmentCustomers: Customer[];
  date: Date; // Usaremos esta data para o rodapé do TablePDF
}

// Componente de Imagem não modificado, mas não será usado diretamente no TablePDF Header
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
    const calculateServiceFee = (total: number) => {
      return Math.max(60, total * 0.1);
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    // Data formatada para o rodapé, conforme imagem (DD/MM/YY)
    const footerDate = format(date, "dd/MM/yy", { locale: ptBR });

    return (
      <PrintablePDF ref={ref} className="shipment-table-print-container">
        <div className="bg-white p-0 max-w-4xl mx-auto text-black print:w-full print:max-w-none font-sans">
          {/* Header com Logo Centralizado */}
          <div className="flex justify-center items-center py-4 bg-[#1C3553]"> {/* Cor de fundo escura */}
            <div className="w-24 h-24 bg-[#1C3553] rounded-full flex flex-col items-center justify-center border-2 border-white">
              <span className="text-white text-xs">ASSESSORIA</span>
              <span className="text-white text-4xl font-bold">AF</span>
              <span className="text-white text-xs">CONSULTORIA</span>
            </div>
          </div>

          {/* Tabela de Clientes */}
          <div className="px-4 pb-4 pt-2"> {/* Adicionado padding para a tabela não colar nas bordas */}
            <div className="overflow-hidden border border-black"> {/* Borda preta ao redor da tabela */}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1C3553] text-white"> {/* Fundo azul escuro, texto branco */}
                    <th className="py-2 px-3 text-center font-medium border-b border-r border-black">NOME</th>
                    <th className="py-2 px-3 text-center font-medium border-b border-r border-black">V. DA COMPRA</th>
                    <th className="py-2 px-3 text-center font-medium border-b border-r border-black">10% SERVIÇO</th>
                    <th className="py-2 px-3 text-center font-medium border-b border-r border-black">TAXA EMB.</th>
                    <th className="py-2 px-3 text-center font-medium border-b border-black">TOTAL</th>
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
                    // Taxa de embalagem não é calculada, então será 0 ou vazio
                    const packingFee = 0; // Assumindo 0 se não houver valor
                    const total = orderTotal + serviceFee + packingFee;

                    return (
                      <tr key={idx} className="bg-[#FFF5F7]"> {/* Rosa bem claro de fundo */}
                        <td className="py-2 px-3 border-b border-r border-black text-left">{`${idx + 1}. ${customer.name}`}</td>
                        <td className="py-2 px-3 border-b border-r border-black text-right">{formatCurrency(orderTotal)}</td>
                        <td className="py-2 px-3 border-b border-r border-black text-right">{formatCurrency(serviceFee)}</td>
                        <td className="py-2 px-3 border-b border-r border-black text-right"></td> {/* Taxa Emb. vazia */}
                        <td className="py-2 px-3 border-b border-black text-right font-medium">{formatCurrency(total)}</td>
                      </tr>
                    );
                  })}
                  {/* Adicionar linhas vazias se necessário para preencher a página, como na imagem */}
                  {Array.from({ length: Math.max(0, 15 - shipmentCustomers.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="bg-[#FFF5F7]">
                      <td className="py-2 px-3 border-b border-r border-black h-10"></td>
                      <td className="py-2 px-3 border-b border-r border-black"></td>
                      <td className="py-2 px-3 border-b border-r border-black"></td>
                      <td className="py-2 px-3 border-b border-r border-black"></td>
                      <td className="py-2 px-3 border-b border-black"></td>
                    </tr>
                  ))}
                </tbody>
                {/* Footer da Tabela (Totalizador) - opcional, pois não está na imagem, mas pode ser útil */}
                {/*
                <tfoot className="bg-[#1C3553] text-white font-bold">
                  <tr>
                    <td colSpan={1} className="py-2 px-3 text-left border-r border-black">Total:</td>
                    <td className="py-2 px-3 text-right border-r border-black">
                      {formatCurrency(shipmentCustomers.reduce((sum, customer) => {
                        const latestOrder = customer.orders?.reduce((l, c) => new Date(c.createdAt) > new Date(l.createdAt) ? c : l, customer.orders[0]);
                        return sum + (latestOrder?.total || 0);
                      }, 0))}
                    </td>
                    <td className="py-2 px-3 text-right border-r border-black">
                      {formatCurrency(shipmentCustomers.reduce((sum, customer) => {
                        const latestOrder = customer.orders?.reduce((l, c) => new Date(c.createdAt) > new Date(l.createdAt) ? c : l, customer.orders[0]);
                        return sum + calculateServiceFee(latestOrder?.total || 0);
                      }, 0))}
                    </td>
                    <td className="py-2 px-3 text-right border-r border-black"></td>
                    <td className="py-2 px-3 text-right">
                      {formatCurrency(shipmentCustomers.reduce((sum, customer) => {
                        const latestOrder = customer.orders?.reduce((l, c) => new Date(c.createdAt) > new Date(l.createdAt) ? c : l, customer.orders[0]);
                        const orderTotal = latestOrder?.total || 0;
                        const serviceFee = calculateServiceFee(orderTotal);
                        return sum + orderTotal + serviceFee;
                      }, 0))}
                    </td>
                  </tr>
                </tfoot>
                */}
              </table>
            </div>
          </div>

          {/* Rodapé do Documento */}
          <div className="bg-[#1C3553] text-white p-3 flex justify-between items-center mt-auto">
            <div className="flex flex-col items-center">
              <span className="text-2xl">🗓️</span> {/* Ícone de calendário */}
              <span className="text-sm">{footerDate}</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">SANTA CRUZ DO CAPIBARIBE - PE</p>
            </div>
            <div className="text-right">
              <p className="text-sm">📞 (84) 9 9811-4515</p> {/* Ícone de telefone */}
              <p className="text-sm">@ANDRADEFLORASSESSORIA</p>
            </div>
          </div>
        </div>
      </PrintablePDF>
    );
  }
);

ShipmentTablePDF.displayName = 'ShipmentTablePDF';


export const ShipmentCardsPDF = React.forwardRef<PrintablePDFRef, ShipmentPDFProps>(
  ({ shipmentCustomers, date }, ref) => { // date prop não é usada aqui, mas mantida por consistência
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
        <div className="bg-transparent mx-auto text-black font-[Montserrat]"> {/* Fundo transparente para não interferir na impressão */}
          {customerPairs.map((pair, pairIndex) => (
            <div
              key={pairIndex}
              className={`flex flex-col gap-4 items-center justify-center ${pairIndex > 0 ? 'page-break-before' : ''}`}
              style={{ height: "297mm", padding: "10mm" }} // A4 height, padding para margens
            >
              {pair.map((customer, idx) => (
                <div
                  key={idx}
                  className="w-[90mm] h-[120mm] border-2 border-black rounded-lg flex flex-col bg-white relative overflow-hidden p-3 shadow-lg"
                  // Ajuste as dimensões (w, h) conforme necessário para o tamanho exato do card
                >
                  {/* Volume indicator */}
                  <div className="absolute top-2 left-2 w-10 h-10 rounded-full bg-black flex items-center justify-center border border-white">
                    <p className="text-white font-bold text-xs">Vol.</p>
                    <p className="text-white font-bold text-sm">01</p>
                  </div>

                  {/* Excursão section */}
                  <div className="flex flex-col items-center text-center pt-2 mt-2"> {/* Adicionado mt-2 para não sobrepor ao Vol. */}
                    <h3 className="font-bold text-lg uppercase mb-1">*EXCURSÃO*</h3>
                    <div className="relative w-full">
                        <h4 className="font-bold text-base uppercase">{customer.tourName || "NOME EXCURSÃO"}</h4>
                        <p className="absolute top-0 right-0 text-xs font-semibold">{customer.tourDepartureTime || "--:--"}</p>
                    </div>
                    <p className="text-xs">{customer.additionalInfo || "Estacionamento dos VAN"}</p> {/* Adicionar campo 'additionalInfo' ao Customer ou usar um default */}
                    <p className="text-xs mt-1">
                        <span className="font-semibold">Setor:</span> {customer.tourSector || "-"} / <span className="font-semibold">Vaga:</span> {customer.tourSeatNumber || "-"}
                    </p>
                  </div>

                  {/* Separating line */}
                  <div className="w-full h-0.5 bg-black my-2"></div>

                  {/* Cliente section */}
                  <div className="flex flex-col items-center text-center flex-grow relative">
                    <h3 className="font-bold text-lg uppercase mb-1">*CLIENTE*</h3>
                    <h4 className="font-bold text-base uppercase leading-tight">{customer.name}</h4>
                    <p className="text-sm my-1">{formatPhone(customer.phone)}</p>
                    <p className="font-bold text-base uppercase underline">
                      {formatCityState(customer.tourCity, customer.tourState)}
                    </p>

                    {/* Footer with logo AF */}
                    <div className="absolute bottom-1 right-1 w-14 h-14 rounded-full bg-[#1C3553] flex flex-col items-center justify-center text-white p-1">
                        <span className="text-[7px] leading-none tracking-tighter">(84) 99811-4515</span>
                        <span className="font-bold text-lg leading-none">AF</span>
                        <span className="text-[6px] leading-none tracking-tighter">@ANDRADEFLOR</span>
                        <span className="text-[6px] leading-none tracking-tighter">ASSESSORIA</span>
                    </div>
                  </div>
                </div>
              ))}
              {/* Se houver apenas um card no par, adicionar um placeholder para manter o layout se necessário */}
              {pair.length === 1 && (
                 <div className="w-[90mm] h-[120mm] border-2 border-transparent rounded-lg"></div>
              )}
            </div>
          ))}
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
            
            @media print {
              body {
                margin: 0;
                font-family: 'Montserrat', sans-serif;
                -webkit-print-color-adjust: exact !important; /* Chrome, Safari */
                color-adjust: exact !important; /* Firefox, Edge */
              }
              .page-break-before {
                page-break-before: always;
              }
              .shipment-table-print-container, .shipment-cards-print-container {
                margin: 0;
                padding: 0;
              }
              @page {
                margin: 0;
                size: A4;
              }
            }
          `}</style>
        </div>
      </PrintablePDF>
    );
  }
);

ShipmentCardsPDF.displayName = 'ShipmentCardsPDF';