# Guia Rápido para Desenvolvedores

Este guia foi elaborado para ajudar novos membros da equipe a configurar e começar a trabalhar no sistema de gerenciamento de clientes e carrinhos.

## Primeiros Passos

### 1. Configuração do Ambiente

```bash
# Clone o repositório
git clone [URL_DO_REPOSITÓRIO]
cd cliente-cart-gerenciador

# Instale as dependências
npm install
# ou
yarn install
# ou
bun install
```

### 2. Execução do Projeto

```bash
# Para iniciar o ambiente de desenvolvimento
npm run dev
# ou
yarn dev
# ou
bun dev
```

O projeto estará disponível em: http://localhost:5173

### 3. Build para Produção

```bash
# Para construir o projeto para produção
npm run build
# ou
yarn build
# ou
bun build

# Para visualizar a build de produção localmente
npm run preview
# ou
yarn preview
# ou
bun preview
```

## Estrutura de Código

### Principais Diretórios

- `src/pages`: Páginas da aplicação
- `src/components`: Componentes reutilizáveis
- `src/stores`: Gerenciamento de estado (Zustand)
- `src/integrations`: Integrações com serviços externos (Supabase)
- `src/types`: Definições de tipos TypeScript

### Principais Convenções de Código

1. **Componentes**: 
   - Utilizamos uma abordagem funcional com Hooks
   - Componentes devem ser pequenos e com responsabilidade única
   - Reuse componentes existentes sempre que possível

2. **Tipagem**:
   - Todo código deve ser fortemente tipado
   - Evite o uso de `any`
   - Defina interfaces/tipos nos arquivos `src/types`

3. **Estado**:
   - Estado global via Zustand stores
   - Estado local com useState/useReducer
   - Estado de servidor com React Query

4. **Estilização**:
   - Utilizamos TailwindCSS para estilização
   - Componentes estilizados via shadcn/ui

## Fluxo de Trabalho

### Fluxo de Git

1. Crie uma branch para sua feature/fix:
   ```bash
   git checkout -b feature/nome-da-feature
   # ou
   git checkout -b fix/nome-do-bug
   ```

2. Faça commits frequentes com mensagens descritivas:
   ```bash
   git commit -m "feat: adiciona funcionalidade X"
   git commit -m "fix: corrige problema Y"
   ```

3. Mantenha sua branch atualizada com a main:
   ```bash
   git pull origin main
   git merge main
   ```

4. Crie um Pull Request quando finalizar.

### Padrões de Código

- Seguimos o padrão ESLint configurado no projeto
- Utilizamos TypeScript rigoroso
- Todos os componentes devem ter nomes descritivos
- Mantenha o código testável e modular

## Gerenciamento de Estado

### Stores Disponíveis

- `useDataStore`: Store central que coordena os outros stores
- `useCustomerStore`: Gerencia clientes e pedidos
- `useProductStore`: Gerencia produtos
- `useShipmentStore`: Gerencia envios

Exemplo de uso:
```tsx
import { useDataStore } from '@/stores';

function MinhaComponente() {
  const { customers, addCustomer } = useDataStore();
  
  // Use os dados e funções aqui
}
```

## Rotas da Aplicação

- `/`: Página inicial
- `/login`: Página de login
- `/dashboard`: Dashboard principal
- `/dashboard/customers`: Gerenciamento de clientes
- `/dashboard/products`: Gerenciamento de produtos
- `/dashboard/orders`: Gerenciamento de pedidos
- `/dashboard/shipments`: Gerenciamento de envios
- `/dashboard/settings`: Configurações

## Recursos Adicionais

### Documentação Completa
Consulte o arquivo `docs/documentacao.md` para uma documentação abrangente do projeto.

### Ajuda e Suporte
Se precisar de ajuda ou tiver dúvidas, não hesite em entrar em contato com o líder técnico da equipe.

---

*Guia atualizado em 16/05/2025* 