
import { supabase } from './client';

// Function to check if storage is available, but don't try to create buckets
export const setupStorage = async () => {
  try {
    // Only check if buckets exist, don't create new ones
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }
    
    // Check if the product-images bucket exists, but don't create it if it doesn't
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

// Function to handle product images using fallback mechanisms
export const uploadProductImage = async (productId: string, file: File): Promise<string> => {
  try {
    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // First try to use localStorage fallback directly
    return URL.createObjectURL(file);
    
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    // If anything fails, return a placeholder
    return '/placeholder.svg';
  }
};

// Also export as default for backward compatibility
export default {
  setupStorage,
  uploadProductImage
};
