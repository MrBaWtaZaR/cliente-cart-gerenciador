import { create } from 'zustand';
import { toast } from 'sonner';
import { Product } from '../types/products';
import { generateId } from '../utils/idGenerator';
import { 
  uploadProductImage, 
  saveProductToDatabase, 
  fetchProductsFromDatabase,
  updateProductInDatabase,
  deleteProductFromDatabase
} from '../integrations/supabase/storage';

interface ProductStore {
  products: Product[];
  isLoading: boolean;
  isStorageAvailable: boolean;
  
  loadProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  uploadProductImage: (productId: string, file: File | string) => Promise<string>;
}

export const useProductStore = create<ProductStore>((set, get) => {
  // Initialize products from localStorage as fallback
  const loadInitialProducts = (): Product[] => {
    try {
      const storedData = localStorage.getItem('products');
      if (storedData) {
        return JSON.parse(storedData).map((product: any) => ({
          ...product,
          createdAt: new Date(product.createdAt)
        }));
      }
    } catch (error) {
      console.error('Error loading products from localStorage:', error);
    }
    return [];
  };

  return {
    products: loadInitialProducts(),
    isLoading: false,
    isStorageAvailable: false,
    
    loadProducts: async () => {
      set({ isLoading: true });
      try {
        // Fetch products from database
        const products = await fetchProductsFromDatabase();
        // Fall back to localStorage if database fetch returns nothing
        if (products.length === 0) {
          const localProducts = loadInitialProducts();
          set({ products: localProducts, isLoading: false });
          return;
        }
        // Update state with products from database
        set({ products, isLoading: false });
        // Also update localStorage as backup
        try {
          localStorage.setItem('products', JSON.stringify(products));
        } catch (storageError) {
          console.error('Failed to save products to localStorage:', storageError);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        set({ isLoading: false });
        toast.error('Erro ao carregar produtos');
      }
    },
    
    addProduct: async (productData) => {
      try {
        // Tenta salvar no banco de dados primeiro
        const newProduct = await saveProductToDatabase(productData);
        
        if (newProduct) {
          // Se salvou no banco, atualiza o estado
          set((state) => {
            const updatedProducts = [...state.products, newProduct];
            
            // Backup no localStorage
            try {
              localStorage.setItem('products', JSON.stringify(updatedProducts));
            } catch (storageError) {
              console.error('Failed to save products to localStorage:', storageError);
            }
            
            return { products: updatedProducts };
          });
          
          toast.success('Produto adicionado com sucesso');
          return;
        }
        
        // Fallback para apenas localStorage se falhou no banco
        const fallbackProduct: Product = {
          id: generateId(),
          ...productData,
          createdAt: new Date()
        };
        
        set((state) => {
          const updatedProducts = [...state.products, fallbackProduct];
          
          try {
            localStorage.setItem('products', JSON.stringify(updatedProducts));
          } catch (storageError) {
            console.error('Failed to save products to localStorage:', storageError);
          }
          
          return { products: updatedProducts };
        });
        
        toast.success('Produto adicionado localmente');
      } catch (error) {
        console.error('Error adding product:', error);
        toast.error('Erro ao adicionar produto');
      }
    },
    
    updateProduct: async (id, productData) => {
      try {
        // Tenta atualizar no banco de dados primeiro
        const success = await updateProductInDatabase(id, productData);
        
        // Atualiza o estado local independentemente do resultado do banco
        set((state) => {
          const updatedProducts = state.products.map((product) => 
            product.id === id ? { ...product, ...productData } : product
          );
          
          // Backup no localStorage
          try {
            localStorage.setItem('products', JSON.stringify(updatedProducts));
          } catch (storageError) {
            console.error('Failed to save updated products to localStorage:', storageError);
          }
          
          return { products: updatedProducts };
        });
        
        if (success) {
          toast.success('Produto atualizado com sucesso');
        } else {
          toast.success('Produto atualizado localmente');
        }
      } catch (error) {
        console.error('Error updating product:', error);
        toast.error('Erro ao atualizar produto');
      }
    },
    
    deleteProduct: async (id) => {
      try {
        // Tenta excluir do banco de dados primeiro
        const success = await deleteProductFromDatabase(id);
        
        // Atualiza o estado local independentemente do resultado do banco
        set((state) => {
          const updatedProducts = state.products.filter((product) => product.id !== id);
          
          // Backup no localStorage
          try {
            localStorage.setItem('products', JSON.stringify(updatedProducts));
          } catch (storageError) {
            console.error('Failed to save products after deletion to localStorage:', storageError);
          }
          
          return { products: updatedProducts };
        });
        
        if (success) {
          toast.success('Produto removido com sucesso');
        } else {
          toast.success('Produto removido localmente');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Erro ao remover produto');
      }
    },
    
    uploadProductImage: async (productId: string, file: File | string) => {
      try {
        if (typeof file === 'string') {
          // Se já é uma URL, apenas retorna
          return file;
        }
        if (!(file instanceof File)) {
          throw new Error('Expected file to be a File object');
        }
        // Agora que os buckets foram criados, tentamos usar o Supabase Storage primeiro
        try {
          const publicUrl = await uploadProductImage(file, productId);
          // Se o upload for bem-sucedido, atualiza a imagem no estado
          if (publicUrl && publicUrl !== '/placeholder.svg') {
            set((state) => {
              const updatedProducts = state.products.map((product) => {
                if (product.id === productId) {
                  const updatedImages = [...(product.images || []).filter(img => img !== '/placeholder.svg'), publicUrl];
                  return {
                    ...product,
                    images: updatedImages
                  };
                }
                return product;
              });
              // Atualiza o localStorage
              try {
                localStorage.setItem('products', JSON.stringify(updatedProducts));
              } catch (storageError) {
                console.error('Failed to save products with image to localStorage:', storageError);
              }
              return { products: updatedProducts };
            });
          }
          toast.success('Imagem adicionada com sucesso');
          return publicUrl;
        } catch (uploadError) {
          console.error('Failed to upload to Supabase:', uploadError);
          // Fall back to local storage
          const blobUrl = URL.createObjectURL(file);
          toast.info('Imagem salva localmente');
          return blobUrl;
        }
      } catch (error) {
        console.error('Error uploading product image:', error);
        toast.error('Erro ao enviar imagem do produto');
        return '/placeholder.svg';
      }
    },
  };
});
