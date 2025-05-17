import { supabase, getStorageUrl } from './client';
import { Product } from '../../types/products';

// Função para verificar se o storage está disponível
export const setupStorage = async () => {
  try {
    console.log('Checking Supabase storage availability...');
    
    // Attempt to list objects in the product-images bucket directly
    // This is a more direct way to check if the bucket is accessible
    const { data: objects, error: objError } = await supabase.storage
      .from('product-images')
      .list('', { limit: 1 });
      
    if (!objError) {
      console.log('Bucket product-images está acessível.');
      return true;
    }
    
    // If that fails, try listing buckets to see if we can find it
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      console.log('Using localStorage as fallback for image storage.');
      return false;
    }
    
    // Check if the product-images bucket exists
    const productImagesBucketExists = buckets.some(bucket => bucket.name === 'product-images');
    
    if (productImagesBucketExists) {
      console.log('Bucket product-images encontrado e pronto para uso.');
      return true;
    } else {
      console.log('Bucket product-images não encontrado. Using localStorage as fallback.');
      return false;
    }
  } catch (err) {
    console.error('Error setting up storage:', err);
    console.log('Using localStorage as fallback for image storage.');
    return false;
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
    
    // Processa e salva as imagens relacionadas ao produto
    const processedImages = [];
    
    if (product.images && product.images.length > 0) {
      // Filtra placeholders
      const realImages = product.images.filter(img => img !== '/placeholder.svg');
      
      if (realImages.length > 0) {
        for (const imageUrl of realImages) {
          if (imageUrl.startsWith('blob:')) {
            // Esta é uma imagem temporária, precisa ser processada
            continue;
          }
          
          // Esta é uma URL já processada
          processedImages.push(imageUrl);
          
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
      images: processedImages.length > 0 ? processedImages : ['/placeholder.svg'],
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

// Função para fazer upload de uma imagem para o bucket do Supabase
export const uploadProductImage = async (productId: string, file: File): Promise<string> => {
  try {
    // Check if bucket exists first
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    const bucketExists = bucketsError ? false : buckets.some(b => b.name === 'product-images');
    
    // Gera um nome de arquivo único com timestamp para evitar colisões
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Tenta fazer o upload do arquivo para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image to Supabase Storage:', uploadError);
      // Se falhar o upload, cria um blob URL para exibição temporária
      const blobUrl = URL.createObjectURL(file);
      console.warn('Fallback to local storage via blob URL');
      return blobUrl;
    }

    // Se o upload for bem-sucedido, obtém a URL pública
    const publicUrl = getStorageUrl('product-images', filePath);
    console.log('Image uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    // Se qualquer coisa falhar, tenta criar um blob URL ou retorna um placeholder
    try {
      if (file instanceof File) {
        return URL.createObjectURL(file);
      }
    } catch (e) {
      console.error('Failed to create object URL:', e);
    }
    // Se tudo falhar, retorna um placeholder
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
