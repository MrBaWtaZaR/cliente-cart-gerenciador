// Não modificar este arquivo diretamente, ele é somente para leitura

import { supabase, getStorageUrl, checkBucketExists } from './client';
import { Product } from '@/types/products';
import { generateId } from '@/utils/idGenerator';

// Mapeamento para controle de tentativas de verificação de buckets
const bucketCheckAttempts = {
  products: 0,
  customers: 0, 
  shipments: 0
};

// Cache global para status dos buckets
const bucketStatusCache = {
  products: false,
  customers: false,
  shipments: false,
  lastCheck: 0
};

// Function to create a storage bucket if it doesn't exist
export const createStorageBucket = async (bucketName: string) => {
  try {
    // Verificar cache primeiro
    if (bucketStatusCache[bucketName] === true) {
      return true;
    }
    
    const bucketExists = await checkBucketExists(bucketName);
    bucketStatusCache[bucketName] = bucketExists;
    
    if (!bucketExists) {
      // Não vamos mais tentar criar buckets aqui, pois eles já foram criados
      console.log(`Bucket ${bucketName} não existe ou não está acessível.`);
      return false;
    } else {
      console.log(`Bucket ${bucketName} existe e está acessível.`);
      return true;
    }
  } catch (err) {
    console.error(`Error checking bucket ${bucketName}:`, err);
    return false;
  }
};

interface SetupStorageOptions {
  skipBucketCreation?: boolean;
  skipExcessiveLogging?: boolean;
  noAttemptIfUnavailable?: boolean;
}

// Setup storage buckets
export const setupStorage = async (options: SetupStorageOptions = {}): Promise<boolean> => {
  const { 
    skipBucketCreation = true,
    skipExcessiveLogging = false,
    noAttemptIfUnavailable = false
  } = options;
  
  // Verificar cache temporal para evitar múltiplas chamadas
  const now = Date.now();
  if (now - bucketStatusCache.lastCheck < 30000) {
    // Usar cache se a última verificação foi há menos de 30 segundos
    if (!skipExcessiveLogging) {
      console.log('Using cached bucket status');
    }
    
    const allBucketsAvailable = bucketStatusCache.products && 
                              bucketStatusCache.customers && 
                              bucketStatusCache.shipments;
    
    return allBucketsAvailable;
  }
  
  if (!skipExcessiveLogging) {
    console.log('Setting up storage buckets...');
  }
  
  const BUCKET_NAMES = ['products', 'customers', 'shipments'];
  let allBucketsAvailable = true;
  
  try {
    // Verificar buckets
    for (const bucketName of BUCKET_NAMES) {
      // Limitar o número de tentativas de verificação por bucket
      if (bucketCheckAttempts[bucketName] > 2 && noAttemptIfUnavailable) {
        if (!skipExcessiveLogging) {
          console.log(`Skipping check for bucket ${bucketName} - previous attempts failed`);
        }
        allBucketsAvailable = false;
        bucketStatusCache[bucketName] = false;
        continue;
      }
      
      bucketCheckAttempts[bucketName]++;
      
      if (!skipExcessiveLogging) {
        console.log(`Checking bucket: ${bucketName}`);
      }
      
      const bucketExists = await checkBucketExists(bucketName);
      bucketStatusCache[bucketName] = bucketExists;
      
      if (!bucketExists) {
        allBucketsAvailable = false;
        console.log(`Bucket ${bucketName} is not available.`);
      } else {
        console.log(`Bucket ${bucketName} is available.`);
      }
    }
    
    // Atualizar timestamp do cache
    bucketStatusCache.lastCheck = now;
    
    if (!skipExcessiveLogging) {
      console.log('Storage setup complete. Buckets available:', allBucketsAvailable);
    }
    
    return allBucketsAvailable;
  } catch (error) {
    console.error('Storage setup check failed:', error);
    
    // Resetar o cache em caso de erro
    BUCKET_NAMES.forEach(name => {
      bucketStatusCache[name] = false;
    });
    bucketStatusCache.lastCheck = now;
    
    console.log('Falling back to local storage only.');
    return false;
  }
};

// Function to upload a product image to storage
export const uploadProductImage = async (productId: string, file: File): Promise<string> => {
  try {
    // Verificar rapidamente o status do bucket usando o cache
    const bucketName = 'products';
    const skipUpload = bucketCheckAttempts[bucketName] > 2 && !bucketStatusCache[bucketName];
    
    // Se já tentamos verificar várias vezes e falhou, nem tenta fazer upload
    if (skipUpload) {
      console.log('Products bucket not available (cached result), using local storage fallback');
      return URL.createObjectURL(file);
    }
    
    // Os buckets agora devem existir, então tentamos fazer upload
    const fileName = `${productId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    // Upload the file to Storage
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading image:', error);
      return URL.createObjectURL(file); // Fallback para URL local
    }

    // Get the public URL
    const publicUrl = getStorageUrl(bucketName, fileName);
    
    // Also record this image in the product_images_relation table
    try {
      await supabase
        .from('product_images_relation')
        .insert({
          product_id: productId,
          image_url: publicUrl
        });
    } catch (dbError) {
      console.error('Error saving image relation to database:', dbError);
      // Continue anyway, the image is still uploaded
    }
      
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    
    // Create local URL as fallback
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    
    return '/placeholder.svg';
  }
};

// Function to save a new product to the database
export const saveProductToDatabase = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product | null> => {
  try {
    const productId = generateId();
    const newProduct: Product = {
      id: productId,
      ...productData,
      createdAt: new Date()
    };

    // Save to Supabase table 'products'
    const { error } = await supabase
      .from('products')
      .insert({
        id: productId,
        name: productData.name,
        description: productData.description || '',
        price: productData.price,
        stock: productData.stock || 0,
      });

    if (error) {
      console.error('Error saving product to database:', error);
      return null;
    }

    // Save product images if they exist and aren't the placeholder
    if (productData.images && productData.images.length > 0) {
      for (const image of productData.images) {
        if (image !== '/placeholder.svg' && !image.startsWith('blob:')) {
          try {
            await supabase
              .from('product_images_relation')
              .insert({
                product_id: productId,
                image_url: image
              });
          } catch (imgError) {
            console.error('Error saving image relation:', imgError);
            // Continue with other images
          }
        }
      }
    }

    return newProduct;
  } catch (error) {
    console.error('Error in saveProductToDatabase:', error);
    return null;
  }
};

// Function to fetch products from the database
export const fetchProductsFromDatabase = async (): Promise<Product[]> => {
  try {
    // Fetch products
    const { data: products, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    // Fetch images for each product
    const productsWithImages: Product[] = await Promise.all(
      products.map(async (product: any) => {
        const { data: images, error: imageError } = await supabase
          .from('product_images_relation')
          .select('image_url')
          .eq('product_id', product.id);

        const imageUrls = imageError || !images || images.length === 0
          ? ['/placeholder.svg']
          : images.map((img: any) => img.image_url);

        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price,
          stock: product.stock || 0,
          images: imageUrls,
          createdAt: new Date(product.created_at) // Fix here: using string from DB and converting to Date
        };
      })
    );

    return productsWithImages;
  } catch (error) {
    console.error('Error in fetchProductsFromDatabase:', error);
    return [];
  }
};

// Function to update a product in the database
export const updateProductInDatabase = async (id: string, productData: Partial<Product>): Promise<boolean> => {
  try {
    // Update product in the 'products' table
    const { error } = await supabase
      .from('products')
      .update({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock: productData.stock,
        updated_at: new Date().toISOString() // Fix here: converting Date to string
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating product:', error);
      return false;
    }

    // Handle images if they were updated
    if (productData.images && productData.images.length > 0) {
      // Get existing images for this product
      const { data: existingImages } = await supabase
        .from('product_images_relation')
        .select('image_url')
        .eq('product_id', id);

      const existingUrls = existingImages ? existingImages.map((img: any) => img.image_url) : [];
      
      // Filter out placeholder and blob URLs
      const newImages = productData.images.filter(img => 
        img !== '/placeholder.svg' && 
        !img.startsWith('blob:') && 
        !existingUrls.includes(img)
      );

      // Add new images
      for (const imageUrl of newImages) {
        await supabase
          .from('product_images_relation')
          .insert({
            product_id: id,
            image_url: imageUrl
          });
      }
    }

    return true;
  } catch (error) {
    console.error('Error in updateProductInDatabase:', error);
    return false;
  }
};

// Function to delete a product from the database
export const deleteProductFromDatabase = async (id: string): Promise<boolean> => {
  try {
    // Delete the product's images from product_images_relation
    const { error: imageError } = await supabase
      .from('product_images_relation')
      .delete()
      .eq('product_id', id);

    if (imageError) {
      console.error('Error deleting product images:', imageError);
      // Continue with product deletion even if image deletion fails
    }

    // Delete the product from the products table
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteProductFromDatabase:', error);
    return false;
  }
};

export { getStorageUrl, checkBucketExists };
