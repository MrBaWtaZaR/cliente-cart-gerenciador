import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: Date;
  orders: Order[];
  // Campos para informações de excursão
  tourName?: string;
  tourSector?: string;
  tourSeatNumber?: string;
  tourCity?: string;
  tourState?: string;
  tourDepartureTime?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  createdAt: Date;
}

export interface Order {
  id: string;
  customerId: string;
  products: OrderProduct[];
  status: 'pending' | 'completed' | 'cancelled';
  total: number;
  createdAt: Date;
}

export interface OrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  images: string[];
}

export interface Shipment {
  id: string;
  name?: string;
  createdAt: Date;
  customers: Customer[];
}

interface DataStore {
  customers: Customer[];
  products: Product[];
  shipments: Shipment[];
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'orders'>) => void;
  updateCustomer: (id: string, customerData: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, productData: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  uploadProductImage: (productId: string, file: File) => Promise<string>;
  
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrderStatus: (customerId: string, orderId: string, status: Order['status']) => void;
  
  addShipment: (customerIds: string[]) => Promise<Shipment>;
  getShipments: () => Promise<void>;
  getShipmentCustomers: (shipmentId: string) => Promise<Customer[]>;
}

// Função para gerar IDs únicos
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Função para gerar dados de exemplo
const generateSampleData = () => {
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
const loadInitialData = () => {
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

const { customers: initialCustomers, products: initialProducts } = loadInitialData();

export const useDataStore = create<DataStore>((set, get) => ({
  customers: initialCustomers,
  products: initialProducts,
  shipments: [],
  
  addCustomer: (customerData) => set((state) => {
    const newCustomer: Customer = {
      id: generateId(),
      ...customerData,
      createdAt: new Date(),
      orders: []
    };
    
    const updatedCustomers = [...state.customers, newCustomer];
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    toast.success('Cliente adicionado com sucesso');
    return { customers: updatedCustomers };
  }),
  
  updateCustomer: (id, customerData) => set((state) => {
    const updatedCustomers = state.customers.map((customer) => 
      customer.id === id ? { ...customer, ...customerData } : customer
    );
    
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    toast.success('Cliente atualizado com sucesso');
    return { customers: updatedCustomers };
  }),
  
  deleteCustomer: (id) => set((state) => {
    const updatedCustomers = state.customers.filter((customer) => customer.id !== id);
    
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    toast.success('Cliente removido com sucesso');
    return { customers: updatedCustomers };
  }),
  
  addProduct: (productData) => set((state) => {
    const newProduct: Product = {
      id: generateId(),
      ...productData,
      createdAt: new Date()
    };
    
    const updatedProducts = [...state.products, newProduct];
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    
    toast.success('Produto adicionado com sucesso');
    return { products: updatedProducts };
  }),
  
  updateProduct: (id, productData) => set((state) => {
    const updatedProducts = state.products.map((product) => 
      product.id === id ? { ...product, ...productData } : product
    );
    
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    
    toast.success('Produto atualizado com sucesso');
    return { products: updatedProducts };
  }),
  
  deleteProduct: (id) => set((state) => {
    const updatedProducts = state.products.filter((product) => product.id !== id);
    
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    
    toast.success('Produto removido com sucesso');
    return { products: updatedProducts };
  }),
  
  uploadProductImage: async (productId, file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${productId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);
        
      if (uploadError) {
        toast.error('Erro ao fazer upload da imagem');
        throw uploadError;
      }
      
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      
      set((state) => {
        const updatedProducts = state.products.map((product) => {
          if (product.id === productId) {
            return {
              ...product,
              images: [...product.images, data.publicUrl]
            };
          }
          return product;
        });
        
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        return { products: updatedProducts };
      });
      
      toast.success('Imagem adicionada com sucesso');
      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Falha ao adicionar imagem');
      throw error;
    }
  },
  
  addOrder: (orderData) => set((state) => {
    const newOrder: Order = {
      id: generateId(),
      ...orderData,
      createdAt: new Date()
    };
    
    const updatedCustomers = state.customers.map((customer) => {
      if (customer.id === orderData.customerId) {
        return {
          ...customer,
          orders: [...customer.orders, newOrder]
        };
      }
      return customer;
    });
    
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    toast.success('Pedido adicionado com sucesso');
    return { customers: updatedCustomers };
  }),
  
  updateOrderStatus: (customerId, orderId, status) => set((state) => {
    const updatedCustomers = state.customers.map((customer) => {
      if (customer.id === customerId) {
        const updatedOrders = customer.orders.map((order) => {
          if (order.id === orderId) {
            return { ...order, status };
          }
          return order;
        });
        
        return { ...customer, orders: updatedOrders };
      }
      return customer;
    });
    
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    toast.success('Status do pedido atualizado');
    return { customers: updatedCustomers };
  }),
  
  addShipment: async (customerIds) => {
    try {
      // Create a new shipment in Supabase
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .insert({})
        .select()
        .single();
        
      if (shipmentError) {
        throw shipmentError;
      }
      
      // Find database UUIDs for each customer - this is the key fix
      const { data: dbCustomers, error: customersError } = await supabase
        .from('customers')
        .select('id, name')
        .in('name', get().customers.filter(c => customerIds.includes(c.id)).map(c => c.name));
        
      if (customersError) {
        throw customersError;
      }
      
      if (!dbCustomers || dbCustomers.length === 0) {
        throw new Error("No matching customers found in database");
      }
      
      // Create shipment-customer associations with database UUIDs
      const shipmentCustomers = dbCustomers.map(dbCustomer => ({
        shipment_id: shipmentData.id,
        customer_id: dbCustomer.id
      }));
      
      const { error: associationError } = await supabase
        .from('shipment_customers')
        .insert(shipmentCustomers);
        
      if (associationError) {
        throw associationError;
      }

      const selectedCustomers = get().customers.filter(customer => 
        customerIds.includes(customer.id)
      );

      const newShipment: Shipment = {
        id: shipmentData.id,
        createdAt: new Date(shipmentData.created_at),
        customers: selectedCustomers
      };
      
      set(state => ({
        shipments: [...state.shipments, newShipment]
      }));
      
      toast.success('Envio criado com sucesso');
      return newShipment;
    } catch (error) {
      console.error('Erro ao criar envio:', error);
      toast.error('Erro ao criar envio');
      throw error;
    }
  },
  
  getShipments: async () => {
    try {
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (shipmentError) {
        throw shipmentError;
      }

      // Transform the data to match our Shipment interface
      const shipments: Shipment[] = await Promise.all(shipmentData.map(async (shipment) => {
        // Get customers for this shipment
        const customers = await get().getShipmentCustomers(shipment.id);
        
        return {
          id: shipment.id,
          name: shipment.name,
          createdAt: new Date(shipment.created_at),
          customers: customers
        };
      }));
      
      set({ shipments });
    } catch (error) {
      console.error('Erro ao carregar envios:', error);
      toast.error('Erro ao carregar histórico de envios');
    }
  },
  
  getShipmentCustomers: async (shipmentId) => {
    try {
      // Get the customer IDs associated with this shipment
      const { data: associations, error: associationError } = await supabase
        .from('shipment_customers')
        .select('customer_id')
        .eq('shipment_id', shipmentId);
        
      if (associationError) {
        throw associationError;
      }
      
      if (!associations || associations.length === 0) {
        return [];
      }
      
      // Get the customer data for those IDs
      const customerIds = associations.map(assoc => assoc.customer_id);
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .in('id', customerIds);
        
      if (customerError) {
        throw customerError;
      }
      
      if (!customerData) {
        return [];
      }

      // Map the customers with their orders from local store
      const customers: Customer[] = customerData.map(customer => {
        // Try to find matching customer in local store to get orders
        const localCustomer = get().customers.find(c => c.id === customer.id);
        
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address || undefined,
          createdAt: new Date(customer.created_at),
          tourName: customer.tour_name || undefined,
          tourSector: customer.tour_sector || undefined,
          tourSeatNumber: customer.tour_seat_number || undefined,
          tourCity: customer.tour_city || undefined,
          tourState: customer.tour_state || undefined,
          tourDepartureTime: customer.tour_departure_time || undefined,
          orders: localCustomer?.orders || []
        };
      });
      
      return customers;
    } catch (error) {
      console.error('Erro ao carregar clientes do envio:', error);
      toast.error('Erro ao carregar detalhes do envio');
      return [];
    }
  }
}));
