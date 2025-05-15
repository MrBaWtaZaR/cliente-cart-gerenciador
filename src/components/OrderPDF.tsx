import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { OrderWithClientAndItems } from "@/types"
import { formatPrice } from "@/lib/utils"
import { getOrderTotal } from "@/lib/order"
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer"

interface OrderPdfProps {
  order: OrderWithClientAndItems
}

export const OrderPdf: React.FC<OrderPdfProps> = ({ order }) => {
  const total = getOrderTotal(order)
  const hasExcursion = !!order.client.excursionName

  return (
    <div className="w-full p-10 text-sm text-black">
      {/* Título */}
      <h1 className="text-center font-bold text-lg mb-1">Resumo do Pedido</h1>
      <p className="text-center text-xs mb-4">
        Pedido Nº: {order.id} <br />
        Data: {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </p>

      {/* Blocos lado a lado */}
      <div className="flex flex-row w-full gap-x-4 mb-5">
        {/* Cliente */}
        <div className="basis-1/2 shrink-0 p-3 border border-gray-200 rounded-md bg-gray-50 text-[10px]">
          <h2 className="font-semibold mb-2">Informações do Cliente</h2>
          <p><strong>Nome:</strong> {order.client.name}</p>
          <p><strong>Email:</strong> {order.client.email}</p>
          <p><strong>Telefone:</strong> {order.client.phone}</p>
          <p><strong>Endereço:</strong> {order.client.city} - {order.client.state}</p>
        </div>

        {/* Excursão */}
        <div className="basis-1/2 shrink-0 p-3 border border-gray-200 rounded-md bg-gray-50 text-[10px]">
          <h2 className="font-semibold mb-2">Detalhes da Excursão</h2>
          {hasExcursion ? (
            <>
              <p><strong>Excursão:</strong> {order.client.excursionName}</p>
              <p><strong>Vagas:</strong> {order.client.excursionSeats}</p>
              <p><strong>Local:</strong> {order.client.city} - {order.client.state}</p>
              <p><strong>Saída:</strong> {order.client.excursionDeparture}</p>
            </>
          ) : (
            <p>Cliente não usa excursão</p>
          )}
        </div>
      </div>

      {/* Itens */}
      <div className="mb-5">
        <h2 className="font-semibold mb-2 text-[10px]">Itens do Pedido</h2>
        <table className="w-full text-[10px] border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 px-2 py-1 text-left">Produto</th>
              <th className="border border-gray-200 px-2 py-1 text-right">Qtd.</th>
              <th className="border border-gray-200 px-2 py-1 text-right">Preço Unit.</th>
              <th className="border border-gray-200 px-2 py-1 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-200 px-2 py-1">{item.productName}</td>
                <td className="border border-gray-200 px-2 py-1 text-right">{item.quantity}</td>
                <td className="border border-gray-200 px-2 py-1 text-right">{formatPrice(item.unitPrice)}</td>
                <td className="border border-gray-200 px-2 py-1 text-right">{formatPrice(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totais */}
      <div className="text-[10px] text-right pr-1">
        <p>Subtotal dos Produtos: <strong>{formatPrice(total.subtotal)}</strong></p>
        <p>Taxa de serviço: <strong>{formatPrice(total.fee)}</strong></p>
        <p className="text-gray-500 text-[9px] italic">Taxa mínima de R$60,00 aplicada.</p>
        <p className="mt-2 text-[11px] font-bold">
          Total Geral: <span className="text-lg">{formatPrice(total.total)}</span>
        </p>
      </div>

      {/* Rodapé */}
      <div className="text-center text-[9px] mt-10 border-t border-gray-200 pt-3">
        <p>Obrigado pela sua preferência!</p>
        <p>ANDRADE & FLOR | CNPJ: XX.XXX.XXX/0001-XX</p>
        <p>
          contato@suaempresa.com | (84) 99811-4515 | @ANDRADEFLORASSESSORIA
        </p>
      </div>
    </div>
  )
}
