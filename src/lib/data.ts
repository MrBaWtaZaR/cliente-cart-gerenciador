import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase, getStorageUrl } from '@/integrations/supabase/client';

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
  isInitialized: boolean;
  isLoading: boolean;
  
  initializeData: () => Promise<void>;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'orders'>) => void;
  updateCustomer: (id: string, customerData: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, productData: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  uploadProductImage: (productId: string, file: File | string) => Promise<string>;
  
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrderStatus: (customerId: string, orderId: string, status: Order['status']) => void;
  updateOrder: (customerId: string, orderId: string, orderData: Partial<Order>) => void;
  deleteOrder: (customerId: string, orderId: string) => void;
  
  addShipment: (customerIds: string[]) => Promise<Shipment>;
  updateShipment: (shipmentId: string, customerIds: string[]) => Promise<Shipment>;
  deleteShipment: (shipmentId: string) => Promise<void>;
  // Update the return type to match the implementation
  getShipments: () => Promise<Shipment[]>;
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
  isInitialized: false,
  isLoading: false,
  
  initializeData: async () => {
    // Don't initialize if already done or in progress
    if (get().isInitialized || get().isLoading) return;
    
    set({ isLoading: true });
    try {
      // Fetch customers from Supabase
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (customerError) {
        console.error('Error loading customers:', customerError);
        throw customerError;
      }
      
      // Fetch shipments to build the complete customers data with orders
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (shipmentError) {
        console.error('Error loading shipments:', shipmentError);
        throw shipmentError;
      }
      
      // Transform customers from Supabase to our app format
      const customers: Customer[] = customerData.map(customer => {
        // Use local customer data if we have it to maintain order history
        const localCustomer = get().customers.find(c => 
          c.name.toLowerCase() === customer.name.toLowerCase() &&
          c.email.toLowerCase() === customer.email.toLowerCase()
        );
        
        return {
          id: localCustomer?.id || generateId(),
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address || undefined,
          createdAt: new Date(customer.created_at || new Date()),
          tourName: customer.tour_name || undefined,
          tourSector: customer.tour_sector || undefined,
          tourSeatNumber: customer.tour_seat_number || undefined,
          tourCity: customer.tour_city || undefined,
          tourState: customer.tour_state || undefined,
          tourDepartureTime: customer.tour_departure_time || undefined,
          orders: localCustomer?.orders || []
        };
      });
      
      // Transform shipments to our app format
      const shipments: Shipment[] = await Promise.all(shipmentData.map(async (shipment) => {
        const fetchedCustomers = await get().getShipmentCustomers(shipment.id);
        
        return {
          id: shipment.id,
          name: shipment.name,
          createdAt: new Date(shipment.created_at),
          customers: fetchedCustomers
        };
      }));
      
      // Set data in store
      set({
        customers,
        shipments,
        isInitialized: true,
        isLoading: false
      });
      
      console.log('Data initialized from Supabase', { customers, shipments });
    } catch (error) {
      console.error('Error initializing data:', error);
      set({ isLoading: false });
      toast.error('Erro ao carregar dados do servidor');
    }
  },
  
  addCustomer: (customerData) => set((state) => {
    const newCustomer: Customer = {
      id: generateId(),
      ...customerData,
      createdAt: new Date(),
      orders: []
    };
    
    const updatedCustomers = [...state.customers, newCustomer];
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    // Also add to Supabase
    supabase.from('customers').insert({
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
      tour_name: customerData.tourName,
      tour_sector: customerData.tourSector,
      tour_seat_number: customerData.tourSeatNumber,
      tour_city: customerData.tourCity, 
      tour_state: customerData.tourState,
      tour_departure_time: customerData.tourDepartureTime
    }).then(({ error }) => {
      if (error) {
        console.error('Error saving customer to Supabase:', error);
        toast.error('Erro ao sincronizar cliente com o servidor');
      }
    });
    
    toast.success('Cliente adicionado com sucesso');
    return { customers: updatedCustomers };
  }),
  
  updateCustomer: (id, customerData) => set((state) => {
    const customerToUpdate = state.customers.find(c => c.id === id);
    if (!customerToUpdate) {
      toast.error('Cliente não encontrado');
      return state;
    }
    
    const updatedCustomers = state.customers.map((customer) => 
      customer.id === id ? { ...customer, ...customerData } : customer
    );
    
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    // Update in Supabase by name (since we don't have the Supabase ID)
    supabase.from('customers')
      .update({
        name: customerData.name || customerToUpdate.name,
        email: customerData.email || customerToUpdate.email,
        phone: customerData.phone || customerToUpdate.phone,
        address: customerData.address,
        tour_name: customerData.tourName,
        tour_sector: customerData.tourSector,
        tour_seat_number: customerData.tourSeatNumber,
        tour_city: customerData.tourCity,
        tour_state: customerData.tourState,
        tour_departure_time: customerData.tourDepartureTime
      })
      .eq('name', customerToUpdate.name)
      .eq('email', customerToUpdate.email)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating customer in Supabase:', error);
          toast.error('Erro ao sincronizar cliente com o servidor');
        }
      });
    
    toast.success('Cliente atualizado com sucesso');
    return { customers: updatedCustomers };
  }),
  
  deleteCustomer: (id) => set((state) => {
    const customerToDelete = state.customers.find(c => c.id === id);
    if (!customerToDelete) {
      toast.error('Cliente não encontrado');
      return state;
    }
    
    const updatedCustomers = state.customers.filter((customer) => customer.id !== id);
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    // Delete from Supabase by matching name and email
    supabase.from('customers')
      .delete()
      .eq('name', customerToDelete.name)
      .eq('email', customerToDelete.email)
      .then(({ error }) => {
        if (error) {
          console.error('Error deleting customer from Supabase:', error);
          toast.error('Erro ao remover cliente do servidor');
        }
      });
    
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
      // Se o arquivo for um blob URL, precisamos primeiro convertê-lo em um arquivo
      let fileToUpload = file;
      
      // Verifica se o arquivo está em formato de blob URL
      if (typeof file === 'string' && file.startsWith('blob:')) {
        try {
          // Busca o arquivo do armazenamento temporário
          const response = await fetch(file);
          const blob = await response.blob();
          
          // Cria um novo arquivo com um nome mais previsível
          const filename = `product_image_${Date.now()}.${blob.type.split('/')[1] || 'jpeg'}`;
          fileToUpload = new File([blob], filename, { type: blob.type });
        } catch (error) {
          console.error('Erro ao converter blob URL para arquivo:', error);
          throw new Error('Não foi possível processar a imagem. Por favor, tente novamente.');
        }
      }
      
      // Continua com o upload normal
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${productId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, fileToUpload);
        
      if (uploadError) {
        console.error('Erro ao fazer upload da imagem:', uploadError);
        toast.error('Erro ao fazer upload da imagem');
        throw uploadError;
      }
      
      const publicUrl = getStorageUrl('product-images', filePath);
      
      set((state) => {
        const updatedProducts = state.products.map((product) => {
          if (product.id === productId) {
            return {
              ...product,
              images: [...product.images.filter(img => img !== '/placeholder.svg'), publicUrl]
            };
          }
          return product;
        });
        
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        return { products: updatedProducts };
      });
      
      toast.success('Imagem adicionada com sucesso');
      return publicUrl;
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
  
  updateOrder: (customerId, orderId, orderData) => set((state) => {
    const updatedCustomers = state.customers.map((customer) => {
      if (customer.id === customerId) {
        const updatedOrders = customer.orders.map((order) => {
          if (order.id === orderId) {
            return { ...order, ...orderData };
          }
          return order;
        });
        
        return { ...customer, orders: updatedOrders };
      }
      return customer;
    });
    
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    toast.success('Pedido atualizado com sucesso');
    return { customers: updatedCustomers };
  }),
  
  deleteOrder: (customerId, orderId) => set((state) => {
    const updatedCustomers = state.customers.map((customer) => {
      if (customer.id === customerId) {
        const updatedOrders = customer.orders.filter((order) => order.id !== orderId);
        return { ...customer, orders: updatedOrders };
      }
      return customer;
    });
    
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    toast.success('Pedido excluído com sucesso');
    return { customers: updatedCustomers };
  }),
  
  addShipment: async (customerIds) => {
    try {
      if (!customerIds || customerIds.length === 0) {
        toast.error('Nenhum cliente selecionado para o envio');
        return null;
      }
      
      console.log('Creating shipment with customers:', customerIds);
      
      // Create a new shipment in Supabase
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          name: `Envio ${new Date().toLocaleDateString('pt-BR')}`
        })
        .select()
        .single();
        
      if (shipmentError) {
        console.error('Error creating shipment:', shipmentError);
        throw shipmentError;
      }
      
      if (!shipmentData) {
        throw new Error('No shipment data returned from database');
      }
      
      console.log('Created shipment:', shipmentData);
      
      // Map local customer names to database customer IDs
      const localCustomers = get().customers.filter(c => customerIds.includes(c.id));
      console.log('Selected customers:', localCustomers);
      
      // Find database UUIDs for each customer by name
      const customerPromises = localCustomers.map(async (localCustomer) => {
        const { data: dbCustomer, error } = await supabase
          .from('customers')
          .select('id')
          .eq('name', localCustomer.name)
          .single();
          
        if (error || !dbCustomer) {
          console.error(`No customer found in DB with name: ${localCustomer.name}`, error);
          
          // If not found, create the customer in the database
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              name: localCustomer.name,
              email: localCustomer.email,
              phone: localCustomer.phone,
              address: localCustomer.address,
              tour_name: localCustomer.tourName,
              tour_sector: localCustomer.tourSector,
              tour_seat_number: localCustomer.tourSeatNumber,
              tour_city: localCustomer.tourCity,
              tour_state: localCustomer.tourState,
              tour_departure_time: localCustomer.tourDepartureTime
            })
            .select('id')
            .single();
            
          if (createError || !newCustomer) {
            console.error('Error creating customer in DB:', createError);
            return null;
          }
          
          return {
            shipment_id: shipmentData.id,
            customer_id: newCustomer.id
          };
        }
        
        return {
          shipment_id: shipmentData.id,
          customer_id: dbCustomer.id
        };
      });
      
      // Wait for all the customer lookups to complete
      const shipmentCustomers = (await Promise.all(customerPromises)).filter(Boolean);
      
      if (shipmentCustomers.length === 0) {
        throw new Error("No matching customers found in database and couldn't create new ones");
      }
      
      console.log('Shipment-customer associations to create:', shipmentCustomers);
      
      // Create shipment-customer associations
      const { error: associationError } = await supabase
        .from('shipment_customers')
        .insert(shipmentCustomers);
        
      if (associationError) {
        console.error('Error creating shipment-customer associations:', associationError);
        throw associationError;
      }

      const selectedCustomers = get().customers.filter(customer => 
        customerIds.includes(customer.id)
      );

      const newShipment: Shipment = {
        id: shipmentData.id,
        name: shipmentData.name,
        createdAt: new Date(shipmentData.created_at),
        customers: selectedCustomers
      };
      
      console.log('Created new shipment with data:', newShipment);
      
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
  
  updateShipment: async (shipmentId, customerIds) => {
    try {
      if (!customerIds || customerIds.length === 0) {
        toast.error('Nenhum cliente selecionado para o envio');
        return null;
      }
      
      console.log('Updating shipment:', shipmentId, 'with customers:', customerIds);
      
      // First, remove all existing associations
      const { error: deleteError } = await supabase
        .from('shipment_customers')
        .delete()
        .eq('shipment_id', shipmentId);
        
      if (deleteError) {
        console.error('Error deleting existing shipment-customer associations:', deleteError);
        throw deleteError;
      }
      
      // Map local customer names to database customer IDs
      const localCustomers = get().customers.filter(c => customerIds.includes(c.id));
      
      // Find database UUIDs for each customer by name
      const customerPromises = localCustomers.map(async (localCustomer) => {
        const { data: dbCustomer, error } = await supabase
          .from('customers')
          .select('id')
          .eq('name', localCustomer.name)
          .single();
          
        if (error || !dbCustomer) {
          console.error(`No customer found in DB with name: ${localCustomer.name}`, error);
          
          // If not found, create the customer in the database
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              name: localCustomer.name,
              email: localCustomer.email,
              phone: localCustomer.phone,
              address: localCustomer.address,
              tour_name: localCustomer.tourName,
              tour_sector: localCustomer.tourSector,
              tour_seat_number: localCustomer.tourSeatNumber,
              tour_city: localCustomer.tourCity,
              tour_state: localCustomer.tourState,
              tour_departure_time: localCustomer.tourDepartureTime
            })
            .select('id')
            .single();
            
          if (createError || !newCustomer) {
            console.error('Error creating customer in DB:', createError);
            return null;
          }
          
          return {
            shipment_id: shipmentId,
            customer_id: newCustomer.id
          };
        }
        
        return {
          shipment_id: shipmentId,
          customer_id: dbCustomer.id
        };
      });
      
      // Wait for all the customer lookups to complete
      const shipmentCustomers = (await Promise.all(customerPromises)).filter(Boolean);
      
      if (shipmentCustomers.length === 0) {
        throw new Error("No matching customers found in database and couldn't create new ones");
      }
      
      // Create new shipment-customer associations
      const { error: associationError } = await supabase
        .from('shipment_customers')
        .insert(shipmentCustomers);
        
      if (associationError) {
        console.error('Error creating new shipment-customer associations:', associationError);
        throw associationError;
      }

      const selectedCustomers = get().customers.filter(customer => 
        customerIds.includes(customer.id)
      );

      const currentShipment = get().shipments.find(s => s.id === shipmentId);
      
      // Update local state
      const updatedShipment: Shipment = {
        id: shipmentId,
        name: currentShipment?.name,
        createdAt: currentShipment?.createdAt || new Date(),
        customers: selectedCustomers
      };
      
      set(state => ({
        shipments: state.shipments.map(shipment => 
          shipment.id === shipmentId ? updatedShipment : shipment
        )
      }));
      
      toast.success('Envio atualizado com sucesso');
      return updatedShipment;
    } catch (error) {
      console.error('Erro ao atualizar envio:', error);
      toast.error('Erro ao atualizar envio');
      throw error;
    }
  },
  
  deleteShipment: async (shipmentId) => {
    try {
      // First, delete all associations
      const { error: deleteAssociationsError } = await supabase
        .from('shipment_customers')
        .delete()
        .eq('shipment_id', shipmentId);
        
      if (deleteAssociationsError) {
        throw deleteAssociationsError;
      }
      
      // Then delete the shipment itself
      const { error: deleteShipmentError } = await supabase
        .from('shipments')
        .delete()
        .eq('id', shipmentId);
        
      if (deleteShipmentError) {
        throw deleteShipmentError;
      }
      
      // Update local state
      set(state => ({
        shipments: state.shipments.filter(shipment => shipment.id !== shipmentId)
      }));
      
      toast.success('Envio excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir envio:', error);
      toast.error('Erro ao excluir envio');
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
      
      return shipments;
    } catch (error) {
      console.error('Erro ao carregar envios:', error);
      toast.error('Erro ao carregar histórico de envios');
      return [];
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
        const localCustomer = get().customers.find(c => 
          c.name.toLowerCase() === customer.name.toLowerCase() &&
          c.email.toLowerCase() === customer.email.toLowerCase()
        );
        
        return {
          id: localCustomer?.id || generateId(),
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address || undefined,
          createdAt: new Date(customer.created_at || new Date()),
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
