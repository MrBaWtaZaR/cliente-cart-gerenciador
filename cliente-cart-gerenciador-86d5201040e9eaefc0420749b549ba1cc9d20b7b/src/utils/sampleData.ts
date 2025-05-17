
import { Customer, Order, OrderProduct } from '../types/customers';
import { Product } from '../types/products';

// Função para gerar dados de exemplo
export const generateSampleData = () => {
  const products: Product[] = [
    {
      id: 'p1',
      name: 'Smartphone Premium',
      description: 'Smartphone de última geração com câmera de alta resolução',
      price: 1999.90,
      images: ['/placeholder.svg', '/placeholder.svg'],
      stock: 15,
      createdAt: new Date()
    },
    {
      id: 'p2',
      name: 'Notebook Ultrafino',
      description: 'Notebook leve e potente para trabalho',
      price: 4500.00,
      images: ['/placeholder.svg', '/placeholder.svg'],
      stock: 8,
      createdAt: new Date()
    },
    {
      id: 'p3',
      name: 'Smart TV 50"',
      description: 'TV com resolução 4K e sistema inteligente',
      price: 2799.90,
      images: ['/placeholder.svg'],
      stock: 12,
      createdAt: new Date()
    }
  ];
  
  const customers: Customer[] = [
    {
      id: 'c1',
      name: 'João Silva',
      email: 'joao.silva@email.com',
      phone: '(11) 98765-4321',
      address: 'Rua das Flores, 123',
      createdAt: new Date(),
      orders: [
        {
          id: 'o1',
          customerId: 'c1',
          products: [
            {
              productId: 'p1',
              productName: 'Smartphone Premium',
              quantity: 1,
              price: 1999.90,
              images: ['/placeholder.svg']
            }
          ],
          status: 'completed',
          total: 1999.90,
          createdAt: new Date(new Date().setDate(new Date().getDate() - 5))
        }
      ]
    },
    {
      id: 'c2',
      name: 'Maria Oliveira',
      email: 'maria.oliveira@email.com',
      phone: '(21) 98765-1234',
      address: 'Av. Principal, 456',
      createdAt: new Date(),
      orders: [
        {
          id: 'o2',
          customerId: 'c2',
          products: [
            {
              productId: 'p2',
              productName: 'Notebook Ultrafino',
              quantity: 1,
              price: 4500.00,
              images: ['/placeholder.svg']
            },
            {
              productId: 'p3',
              productName: 'Smart TV 50"',
              quantity: 1,
              price: 2799.90,
              images: ['/placeholder.svg']
            }
          ],
          status: 'pending',
          total: 7299.90,
          createdAt: new Date()
        }
      ]
    },
    {
      id: 'c3',
      name: 'Carlos Ferreira',
      email: 'carlos.ferreira@email.com',
      phone: '(31) 99876-5432',
      createdAt: new Date(),
      orders: []
    }
  ];
  
  return { products, customers };
};

// Carregar dados do localStorage ou usar dados de exemplo
export const loadInitialData = () => {
  try {
    const storedCustomers = localStorage.getItem('customers');
    const storedProducts = localStorage.getItem('products');
    
    if (storedCustomers && storedProducts) {
      const customers = JSON.parse(storedCustomers);
      const products = JSON.parse(storedProducts);
      
      // Converter strings de data para objetos Date
      customers.forEach((c: Customer) => {
        c.createdAt = new Date(c.createdAt);
        c.orders.forEach((o: Order) => {
          o.createdAt = new Date(o.createdAt);
        });
      });
      
      products.forEach((p: Product) => {
        p.createdAt = new Date(p.createdAt);
      });
      
      return { customers, products };
    }
    
    return generateSampleData();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    return generateSampleData();
  }
};
