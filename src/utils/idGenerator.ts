
import { v4 as uuidv4 } from 'uuid';

// Função para gerar IDs únicos compatíveis com o formato UUID do Supabase
export const generateId = () => {
  // Retorna um UUID válido no formato exigido pelo Supabase
  return uuidv4();
};

// Função auxiliar para verificar se um ID está no formato UUID válido
export const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};
