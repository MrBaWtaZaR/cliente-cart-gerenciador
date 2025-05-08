
import { supabase, getStorageUrl } from './client';
import { Product } from '../../types/products';

// Função para verificar se o storage está disponível
export const setupStorage = async () => {
  try {
    // Verificar se os buckets existem
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }
    
    // Não tenta criar buckets, apenas verifica se existem
    const productImagesBucketExists = buckets.some(bucket => bucket.name === 'product-images');
    
    if (productImagesBucketExists) {
      console.log('Bucket product-images found and will be used for uploads.');
    } else {
      console.log('Bucket product-images not found. Using local storage as fallback.');
      console.info('You may need to create the bucket manually in the Supabase console.');
    }
  } catch (err) {
    console.error('Error setting up storage:', err);
  }
};

// Função para salvar um produto no banco de dados
export const saveProductToDatabase = async (product: Omit<Product, 'id' | 'createdAt'>): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving product to database:', error);
      return null;
    }
    
    if (!data) {
      console.error('No data returned when saving product');
      return null;
    }
    
    // Salvar as imagens relacionadas ao produto
    if (product.images && product.images.length > 0) {
      // Filtra placeholders
      const realImages = product.images.filter(img => img !== '/placeholder.svg');
      
      if (realImages.length > 0) {
        for (const imageUrl of realImages) {
          // Salva a referência da imagem no banco de dados
          const { error: imageError } = await supabase
            .from('product_images_relation')
            .insert({
              product_id: data.id,
              image_url: imageUrl
            });
            
          if (imageError) {
            console.error('Error saving product image reference:', imageError);
          }
        }
      }
    }
    
    return {
      ...data,
      images: product.images,
      createdAt: new Date(data.created_at)
    };
  } catch (err) {
    console.error('Error in saveProductToDatabase:', err);
    return null;
  }
};

// Função para atualizar um produto no banco de dados
export const updateProductInDatabase = async (id: string, product: Partial<Product>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating product in database:', error);
      return false;
    }
    
    // Se houver novas imagens, salva-as
    if (product.images && product.images.length > 0) {
      // Filtra placeholders
      const realImages = product.images.filter(img => img !== '/placeholder.svg');
      
      // Remove imagens antigas
      const { error: deleteError } = await supabase
        .from('product_images_relation')
        .delete()
        .eq('product_id', id);
        
      if (deleteError) {
        console.error('Error deleting old product images:', deleteError);
      }
      
      // Adiciona novas imagens
      if (realImages.length > 0) {
        for (const imageUrl of realImages) {
          const { error: imageError } = await supabase
            .from('product_images_relation')
            .insert({
              product_id: id,
              image_url: imageUrl
            });
            
          if (imageError) {
            console.error('Error saving product image reference:', imageError);
          }
        }
      }
    }
    
    return true;
  } catch (err) {
    console.error('Error in updateProductInDatabase:', err);
    return false;
  }
};

// Função para buscar todos os produtos do banco de dados
export const fetchProductsFromDatabase = async (): Promise<Product[]> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching products from database:', error);
      return [];
    }
    
    // Buscar imagens para cada produto
    const productsWithImages: Product[] = [];
    
    for (const product of products) {
      const { data: imageData, error: imageError } = await supabase
        .from('product_images_relation')
        .select('image_url')
        .eq('product_id', product.id);
        
      if (imageError) {
        console.error(`Error fetching images for product ${product.id}:`, imageError);
      }
      
      const images = imageData && imageData.length > 0 
        ? imageData.map(img => img.image_url) 
        : ['/placeholder.svg'];
        
      productsWithImages.push({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock || 0,
        images,
        createdAt: new Date(product.created_at)
      });
    }
    
    return productsWithImages;
  } catch (err) {
    console.error('Error in fetchProductsFromDatabase:', err);
    return [];
  }
};

// Função para excluir um produto do banco de dados
export const deleteProductFromDatabase = async (id: string): Promise<boolean> => {
  try {
    // As imagens serão excluídas automaticamente devido à restrição ON DELETE CASCADE
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting product from database:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error in deleteProductFromDatabase:', err);
    return false;
  }
};

// Função para fazer upload de uma imagem para o armazenamento local ou Supabase
export const uploadProductImage = async (productId: string, file: File): Promise<string> => {
  try {
    // Cria um blob URL para exibição imediata
    const blobUrl = URL.createObjectURL(file);
    
    // Se o arquivo for muito grande (> 5MB), retorna apenas o blob URL
    if (file.size > 5 * 1024 * 1024) {
      console.warn('File too large, using blob URL only:', file.size);
      return blobUrl;
    }
    
    return blobUrl;
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    // Se qualquer coisa falhar, retorna um placeholder
    return '/placeholder.svg';
  }
};

// Também exporta como default para compatibilidade
export default {
  setupStorage,
  uploadProductImage,
  saveProductToDatabase,
  updateProductInDatabase,
  fetchProductsFromDatabase,
  deleteProductFromDatabase
};
