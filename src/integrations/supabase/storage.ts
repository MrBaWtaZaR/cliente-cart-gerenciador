// Não modificar este arquivo diretamente, ele é somente para leitura

import { supabase, getStorageUrl } from './client';
import { Product } from '@/types/products';
import { generateId } from '@/utils/idGenerator';

// Função para obter a URL de uma imagem de produto
export const getProductImageUrl = (path: string) => {
  return getStorageUrl('product-images', path);
};

// Função para upload de imagem de produto
export const uploadProductImage = async (file: File, productId: string) => {
  const filePath = `${productId}/${file.name}`;
  const { data, error } = await supabase.storage.from('product-images').upload(filePath, file);
  if (error) throw error;
  // Retorna a URL pública da imagem
  return getStorageUrl('product-images', filePath);
};

// Função para deletar imagem de produto
export const deleteProductImage = async (filePath: string) => {
  const { error } = await supabase.storage.from('product-images').remove([filePath]);
  if (error) throw error;
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
