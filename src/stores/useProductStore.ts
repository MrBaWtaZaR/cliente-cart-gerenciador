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
        
        // Use try-catch for localStorage to prevent unhandled exceptions
        try {
          localStorage.setItem('products', JSON.stringify(updatedProducts));
        } catch (storageError) {
          console.error('Failed to save products to localStorage:', storageError);
          // Continue with the operation even if localStorage fails
        }
        
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
        
        // Use try-catch for localStorage to prevent unhandled exceptions
        try {
          localStorage.setItem('products', JSON.stringify(updatedProducts));
        } catch (storageError) {
          console.error('Failed to save updated products to localStorage:', storageError);
          // Continue with the operation even if localStorage fails
        }
        
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
        
        // Use try-catch for localStorage to prevent unhandled exceptions
        try {
          localStorage.setItem('products', JSON.stringify(updatedProducts));
        } catch (storageError) {
          console.error('Failed to save products after deletion to localStorage:', storageError);
          // Continue with the operation even if localStorage fails
        }
        
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
        let publicUrl = '';
        
        // Use simplified approach - just create blob URL if it's a File
        if (fileToUpload instanceof File) {
          publicUrl = URL.createObjectURL(fileToUpload);
        } else {
          // If it's already a string URL, just use it
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
            
            try {
              localStorage.setItem('products', JSON.stringify(updatedProducts));
            } catch (storageError) {
              console.error('Failed to save products with image to localStorage:', storageError);
              // Continue with the operation even if localStorage fails
            }
            
            return { products: updatedProducts };
          } catch (error) {
            console.error('Error updating product with image:', error);
            // Don't update state if there was an error
            return state;
          }
        });
        
        toast.success('Imagem adicionada com sucesso');
        return publicUrl;
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        toast.error('Falha ao adicionar imagem');
        
        // Return placeholder in case of error
        return '/placeholder.svg';
      }
    },
  };
});
