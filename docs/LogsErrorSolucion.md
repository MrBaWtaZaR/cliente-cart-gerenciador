# Logs de Erros e Soluções

Este documento registra os principais erros enfrentados no desenvolvimento do sistema e as soluções aplicadas, servindo como referência para consultas futuras.

---

## 1. Erro: "The requested module '/src/integrations/supabase/storage.ts' does not provide an export named 'setupStorage'"

**Descrição:**  
Após alterações no código, a aplicação não abria e apresentava o erro acima no console do navegador. O erro indicava que o arquivo `storage.ts` não exportava mais a função `setupStorage`, mas ainda existiam referências a ela em outros arquivos.

**Solução:**  
- Foram removidas todas as referências à função `setupStorage` nos arquivos:
  - `src/stores/index.ts` (exportação removida)
  - `src/lib/init.ts` (toda a lógica de inicialização de storage baseada em `setupStorage` foi removida)
- Após a remoção, a aplicação voltou a funcionar normalmente.
- Recomenda-se, caso seja necessário no futuro, criar funções utilitárias específicas para checagem ou criação de buckets, evitando dependências quebradas.

--- 