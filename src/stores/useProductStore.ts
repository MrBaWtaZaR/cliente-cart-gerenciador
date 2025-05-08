
import { create } from 'zustand';
import { toast } from 'sonner';
import { Product } from '../types/products';
import { generateId } from '../utils/idGenerator';
import { uploadProductImage } from '../integrations/supabase/storage';

interface ProductStore {
  products: Product[];
  
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, productData: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  uploadProductImage: (productId: string, file: File | string) => Promise<string>;
}

export const useProductStore = create<ProductStore>((set, get) => {
  // Initialize products from localStorage
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
    
    addProduct: (productData) => set((state) => {
      try {
        const newProduct: Product = {
          id: generateId(),
          ...productData,
          createdAt: new Date()
        };
        
        const updatedProducts = [...state.products, newProduct];
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        
        toast.success('Produto adicionado com sucesso');
        return { products: updatedProducts };
      } catch (error) {
        console.error('Error adding product:', error);
        toast.error('Erro ao adicionar produto');
        return state;
      }
    }),
    
    updateProduct: (id, productData) => set((state) => {
      try {
        const updatedProducts = state.products.map((product) => 
          product.id === id ? { ...product, ...productData } : product
        );
        
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        
        toast.success('Produto atualizado com sucesso');
        return { products: updatedProducts };
      } catch (error) {
        console.error('Error updating product:', error);
        toast.error('Erro ao atualizar produto');
        return state;
      }
    }),
    
    deleteProduct: (id) => set((state) => {
      try {
        const updatedProducts = state.products.filter((product) => product.id !== id);
        
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        
        toast.success('Produto removido com sucesso');
        return { products: updatedProducts };
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Erro ao remover produto');
        return state;
      }
    }),
    
    uploadProductImage: async (productId: string, file: File | string) => {
      try {
        // Se o arquivo for um blob URL, precisamos primeiro convertê-lo em um arquivo
        let fileToUpload = file;
        let fileName = '';
        
        // Verifica se o arquivo está em formato de string (blob URL)
        if (typeof file === 'string' && file.startsWith('blob:')) {
          try {
            // Busca o arquivo do armazenamento temporário
            const response = await fetch(file);
            const blob = await response.blob();
            
            // Cria um novo arquivo com um nome mais previsível
            fileName = `product_image_${Date.now()}.${blob.type.split('/')[1] || 'jpeg'}`;
            fileToUpload = new File([blob], fileName, { type: blob.type });
          } catch (error) {
            console.error('Erro ao converter blob URL para arquivo:', error);
            throw new Error('Não foi possível processar a imagem. Por favor, tente novamente.');
          }
        } else if (fileToUpload instanceof File) {
          // Se for um File object, pegamos o nome diretamente
          fileName = fileToUpload.name;
        } else {
          // Se for uma string que não é blob URL (como uma URL regular)
          // Geramos um nome de arquivo baseado no timestamp
          fileName = `image_${Date.now()}.jpg`;
        }
        
        // Usa a função especializada para fazer o upload
        let publicUrl = '';
        
        if (fileToUpload instanceof File) {
          publicUrl = await uploadProductImage(productId, fileToUpload);
        } else {
          // Se por algum motivo ainda temos uma string, retornamos ela como URL
          publicUrl = fileToUpload;
        }
        
        set((state) => {
          try {
            const updatedProducts = state.products.map((product) => {
              if (product.id === productId) {
                return {
                  ...product,
                  images: [...(product.images || []).filter(img => img !== '/placeholder.svg'), publicUrl]
                };
              }
              return product;
            });
            
            localStorage.setItem('products', JSON.stringify(updatedProducts));
            return { products: updatedProducts };
          } catch (error) {
            console.error('Error updating product with image:', error);
            // Don't update state if there was an error storing to localStorage
            return state;
          }
        });
        
        toast.success('Imagem adicionada com sucesso');
        return publicUrl;
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        toast.error('Falha ao adicionar imagem');
        throw error;
      }
    },
  };
});
