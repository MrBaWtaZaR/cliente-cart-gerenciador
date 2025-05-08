
import { supabase } from './client';

// Função para garantir que os buckets necessários existam
export const setupStorage = async () => {
  try {
    // Verifica se o bucket product-images existe
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Erro ao listar buckets:', error);
      return;
    }
    
    const productImagesBucketExists = buckets.some(bucket => bucket.name === 'product-images');
    
    // Se o bucket não existir, cria-o
    if (!productImagesBucketExists) {
      const { error: createError } = await supabase.storage.createBucket('product-images', {
        public: true, // Permite acesso público aos arquivos
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('Erro ao criar bucket product-images:', createError);
      } else {
        console.log('Bucket product-images criado com sucesso');
      }
    }
  } catch (err) {
    console.error('Erro ao configurar storage:', err);
  }
};

// Exporta a função para ser chamada na inicialização do aplicativo
export default setupStorage;
