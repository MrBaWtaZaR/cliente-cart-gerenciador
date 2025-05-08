
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
    
    // Se o bucket não existir, não tentamos criar pelo cliente
    // pois isso exigiria permissões especiais
    if (!productImagesBucketExists) {
      console.log('O bucket product-images não existe. Usando bucket default para uploads.');
      
      // Vamos tentar usar o bucket "default" que geralmente já existe em projetos Supabase
      const { data: defaultBucket } = await supabase.storage.getBucket('default');
      
      if (!defaultBucket) {
        console.log('Bucket default também não existe. O upload de imagens pode não funcionar corretamente.');
      } else {
        console.log('Usando bucket default para uploads de produtos.');
      }
    } else {
      console.log('Bucket product-images encontrado e será usado para uploads.');
    }
  } catch (err) {
    console.error('Erro ao configurar storage:', err);
  }
};

// Função para fazer upload de uma imagem usando o bucket correto
export const uploadProductImage = async (productId: string, file: File): Promise<string> => {
  try {
    // Primeiro tentamos usar o bucket product-images
    const bucketName = 'product-images';
    
    // Cria um nome de arquivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${productId}/${fileName}`;
    
    // Tenta fazer upload para o bucket product-images
    let { error: uploadError, data } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);
      
    // Se houver erro, tenta usar o bucket default
    if (uploadError) {
      console.log('Erro ao fazer upload para product-images, tentando bucket default:', uploadError);
      
      const { error: defaultUploadError, data: defaultData } = await supabase.storage
        .from('default')
        .upload(filePath, file);
        
      if (defaultUploadError) {
        throw defaultUploadError;
      }
      
      // Retorna a URL pública do arquivo no bucket default
      const { data: publicUrlData } = supabase.storage
        .from('default')
        .getPublicUrl(filePath);
        
      return publicUrlData.publicUrl;
    }
    
    // Retorna a URL pública do arquivo
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
};

// Exporta as funções
export default setupStorage;
