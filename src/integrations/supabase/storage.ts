// Não modificar este arquivo diretamente, ele é somente para leitura

import { supabase, getStorageUrl, checkBucketExists } from './client';

// Function to create a storage bucket if it doesn't exist
export const createStorageBucket = async (bucketName: string) => {
  try {
    const bucketExists = await checkBucketExists(bucketName);
    if (!bucketExists) {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true, // Make the bucket public
      });

      if (error) {
        console.error(`Error creating bucket ${bucketName}:`, error.message);
        return false;
      }

      console.log(`Bucket ${bucketName} created successfully.`);
      return true;
    } else {
      console.log(`Bucket ${bucketName} already exists.`);
      return true;
    }
  } catch (err) {
    console.error(`Error creating bucket ${bucketName}:`, err);
    return false;
  }
};

interface SetupStorageOptions {
  skipBucketCreation?: boolean;
}

// Setup storage buckets
export const setupStorage = async (options: SetupStorageOptions = {}): Promise<boolean> => {
  const { skipBucketCreation = false } = options;
  
  console.log('Setting up storage buckets...');
  
  const BUCKET_NAMES = ['products', 'customers', 'shipments'];
  
  try {
    for (const bucketName of BUCKET_NAMES) {
      if (!skipBucketCreation) {
        const bucketCreated = await createStorageBucket(bucketName);
        if (!bucketCreated) {
          console.error(`Failed to create or verify bucket: ${bucketName}`);
          return false;
        }
      } else {
        console.log(`Skipping bucket creation for ${bucketName}`);
      }
    }
    
    console.log('Storage setup complete.');
    return true;
  } catch (error) {
    console.error('Storage setup failed:', error);
    return false;
  }
};

export { getStorageUrl, checkBucketExists };
