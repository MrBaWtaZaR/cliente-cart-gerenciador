
import { supabase } from './client';

// Function to ensure necessary buckets exist
export const setupStorage = async () => {
  try {
    // Check if the product-images bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }
    
    // Create the product-images bucket if it doesn't exist
    const productImagesBucketExists = buckets.some(bucket => bucket.name === 'product-images');
    
    if (!productImagesBucketExists) {
      try {
        const { data, error } = await supabase.storage.createBucket('product-images', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        });
        
        if (error) {
          console.error('Error creating product-images bucket:', error);
        } else {
          console.log('Created product-images bucket successfully');
        }
      } catch (bucketError) {
        console.error('Failed to create product-images bucket:', bucketError);
      }
    } else {
      console.log('Bucket product-images found and will be used for uploads.');
    }
  } catch (err) {
    console.error('Error setting up storage:', err);
  }
};

// Function to upload a product image
export const uploadProductImage = async (productId: string, file: File): Promise<string> => {
  try {
    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${productId}/${fileName}`;
    
    // Try to upload to the product-images bucket
    const { error: uploadError, data } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);
      
    if (uploadError) {
      console.error('Error uploading to product-images:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL of the file
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
      
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Export functions individually so they can be imported separately
export { setupStorage, uploadProductImage };

// Also export as default for backward compatibility
export default {
  setupStorage,
  uploadProductImage
};
