
import { useEffect, useState, useMemo } from 'react';
import { useDataStore, Customer, Product, Order } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, Package, ShoppingCart } from 'lucide-react';

interface DashboardMetric {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
}

export const DashboardPage = () => {
  const customers = useDataStore((state) => state.customers);
  const products = useDataStore((state) => state.products);
  const [metrics, setMetrics] = useState<DashboardMetric>({
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
  });

  // Use useMemo para calcular as métricas sempre que os clientes ou produtos mudarem
  const calculatedMetrics = useMemo(() => {
    // Calcular métricas
    const allOrders = customers.flatMap(customer => customer.orders);
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Ordenar pedidos por data (mais recente primeiro)
    const sortedOrders = [...allOrders].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalOrders: allOrders.length,
      totalRevenue,
      recentOrders: sortedOrders.slice(0, 5)
    };
  }, [customers, products]);

  useEffect(() => {
    setMetrics(calculatedMetrics);
  }, [calculatedMetrics]);

  // Dados para o gráfico de receita
  const revenueData = useMemo(() => {
    const allOrders = customers.flatMap(customer => customer.orders);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        formattedDate: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        revenue: 0
      };
    }).reverse();
    
    // Calcular receita diária
    allOrders.forEach(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      const dayData = last7Days.find(day => day.date === orderDate);
      if (dayData) {
        dayData.revenue += order.total;
      }
    });
    
    return last7Days.map(day => ({
      date: day.formattedDate,
      revenue: Number(day.revenue.toFixed(2))
    }));
  }, [customers]);

  // Dados para o gráfico de produtos mais vendidos
  const topProductsData = useMemo(() => {
    const productSales: Record<string, { name: string, quantity: number }> = {};
    
    customers.forEach(customer => {
      customer.orders.forEach(order => {
        order.products.forEach(item => {
          if (productSales[item.productId]) {
            productSales[item.productId].quantity += item.quantity;
          } else {
            productSales[item.productId] = {
              name: item.productName,
              quantity: item.quantity
            };
          }
        });
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [customers]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-muted-foreground">Clientes</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center space-x-4">
            <div className="p-2 bg-blue-500 text-white rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">{metrics.totalCustomers}</div>
              <p className="text-sm text-muted-foreground">Total de clientes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-muted-foreground">Produtos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center space-x-4">
            <div className="p-2 bg-purple-500 text-white rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">{metrics.totalProducts}</div>
              <p className="text-sm text-muted-foreground">Total de produtos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-muted-foreground">Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center space-x-4">
            <div className="p-2 bg-green-500 text-white rounded-lg">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">{metrics.totalOrders}</div>
              <p className="text-sm text-muted-foreground">Total de pedidos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-muted-foreground">Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(metrics.totalRevenue)}
            </div>
            <p className="text-sm text-muted-foreground">Receita total</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita dos últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Receita"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Produtos mais vendidos</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="quantity" 
                  name="Quantidade" 
                  fill="hsl(var(--accent))"
                  radius={[0, 4, 4, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left">Cliente</th>
                  <th className="py-3 px-4 text-left">Data</th>
                  <th className="py-3 px-4 text-left">Valor</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Produtos</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentOrders.map(order => {
                  const customer = customers.find(c => c.id === order.customerId);
                  return (
                    <tr key={order.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">{customer?.name || 'Cliente não encontrado'}</td>
                      <td className="py-3 px-4">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(order.total)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status === 'completed' ? 'Concluído' :
                           order.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {order.products.length} itens
                      </td>
                    </tr>
                  );
                })}
                {metrics.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      Nenhum pedido recente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
