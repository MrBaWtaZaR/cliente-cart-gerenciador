# Documentação do Sistema de Gerenciamento de Clientes e Carrinhos

## Visão Geral

Este projeto é um sistema completo de gerenciamento para vendas, clientes, produtos e envios, desenvolvido com React, TypeScript e Vite. A aplicação permite o controle completo do ciclo de vendas, desde o cadastro de clientes e produtos até o gerenciamento de pedidos e envios.

## Tecnologias Utilizadas

### Frontend
- **React 18**: Framework de UI principal
- **TypeScript**: Tipagem estática para desenvolvimento mais seguro
- **Vite**: Ferramenta de build moderna para desenvolvimento rápido
- **React Router**: Para gerenciamento de rotas
- **TailwindCSS**: Framework CSS para estilização
- **Zustand**: Biblioteca para gerenciamento de estado global
- **Shadcn/UI**: Componentes de UI reutilizáveis e estilizáveis
- **React Query**: Para gerenciamento de requisições e cache
- **Recharts**: Biblioteca para criação de gráficos
- **React Hook Form + Zod**: Para formulários com validação

### Backend e Integração
- **Supabase**: Plataforma de backend que provê banco de dados PostgreSQL, autenticação e armazenamento
- **REST API**: Comunicação com o backend via API REST

## Estrutura do Projeto

```
cliente-cart-gerenciador/
├── src/                 # Código fonte principal
│   ├── components/      # Componentes reutilizáveis
│   │   ├── ui/          # Componentes de UI genéricos (shadcn/ui)
│   │   └── ...          # Outros componentes específicos da aplicação
│   ├── hooks/           # Custom hooks
│   ├── integrations/    # Integrações com serviços externos
│   │   └── supabase/    # Cliente e tipos do Supabase
│   ├── lib/             # Bibliotecas e utilitários
│   ├── pages/           # Páginas da aplicação
│   ├── stores/          # Gerenciamento de estado global (Zustand)
│   ├── types/           # Definições de tipos TypeScript
│   └── utils/           # Funções utilitárias
├── public/              # Arquivos estáticos
├── docs/                # Documentação
└── ...                  # Arquivos de configuração (vite, tailwind, etc.)
```

## Módulos Principais

### Gerenciamento de Clientes
O sistema permite cadastrar, visualizar, editar e excluir clientes. Cada cliente possui:
- Informações pessoais (nome, telefone, endereço)
- Histórico de pedidos
- Histórico de envios

### Gerenciamento de Produtos
Funcionalidades para gestão completa do catálogo de produtos:
- Cadastro de produtos com nome, descrição, preço, estoque
- Upload de imagens para produtos
- Controle de estoque
- Categorização de produtos

### Gerenciamento de Pedidos
O sistema oferece controle total sobre os pedidos:
- Criação de pedidos associados a clientes
- Adição de múltiplos produtos a um pedido
- Cálculo automático de valores
- Acompanhamento do status do pedido (pendente, processando, enviado, entregue, cancelado)
- Geração de PDF para pedidos

### Gerenciamento de Envios
Módulo para controle de envios e entregas:
- Criação de remessas de envio com múltiplos pedidos
- Acompanhamento do status de entrega
- Geração de etiquetas e documentos para envio
- Impressão de documentos de envio

### Dashboard
Painel com visão geral sobre o desempenho do negócio:
- Gráficos de vendas e receita
- Indicadores de desempenho (clientes, produtos, pedidos, receita)
- Listagem de pedidos recentes
- Produtos mais vendidos

## Fluxo de Dados

O sistema utiliza uma arquitetura baseada em stores com Zustand para gerenciar o estado da aplicação:

1. **useDataStore**: Store central que coordena todos os outros stores e mantém o estado global
2. **useCustomerStore**: Gerenciamento de clientes e pedidos
3. **useProductStore**: Gerenciamento de produtos e estoque
4. **useShipmentStore**: Gerenciamento de envios

Os dados são sincronizados com o Supabase, que serve como backend para a aplicação.

## Autenticação e Segurança

O sistema utiliza autenticação via Supabase, com:
- Login seguro
- Proteção de rotas com AuthGuard
- Tokens JWT para autenticação

## Instalação e Configuração

### Requisitos
- Node.js v18+
- npm ou yarn ou bun

### Instalação

```bash
# Instalar dependências
npm install
# ou
yarn install
# ou
bun install

# Iniciar ambiente de desenvolvimento
npm run dev
# ou 
yarn dev
# ou
bun dev
```

### Variáveis de Ambiente
A aplicação utiliza as seguintes variáveis de ambiente (já configuradas no projeto):

- Conexão com Supabase:
  - URL e chave pública de API do Supabase (já configuradas)

## Integração com Supabase

O projeto utiliza o Supabase para persistência de dados, autenticação e armazenamento:

### Tabelas Principais
- **customers**: Dados dos clientes
- **products**: Produtos cadastrados
- **orders**: Pedidos realizados
- **order_items**: Itens de cada pedido
- **shipments**: Remessas de envio

### Buckets de Armazenamento
- **product-images**: Para armazenar imagens de produtos

## Funcionalidades Avançadas

### Impressão de Documentos
O sistema permite gerar e imprimir documentos como:
- Detalhes de pedidos
- Etiquetas de envio
- Relatórios de remessas

### Visualização de Dados
- Gráficos interativos para análise de vendas
- Filtros avançados para pesquisa de clientes, produtos e pedidos
- Categorização e agrupamento de informações

### Sincronização de Dados
Mecanismos para garantir que os dados estejam sempre atualizados:
- Sincronização periódica com o backend
- Controle de concorrência para edições simultâneas
- Notificações de alterações via eventos

## Boas Práticas e Padrões

### Componentes Reutilizáveis
O sistema utiliza uma arquitetura de componentes com foco em reusabilidade, seguindo o padrão de composição do React.

### Gerenciamento de Estado
- Estado global com Zustand
- Estado local com useState e useReducer
- Cache e sincronização com React Query

### Validação de Dados
- Formulários validados com Zod
- TypeScript para tipagem estática
- Validação no cliente e no servidor

### Organização do Código
- Componentes pequenos e focados
- Separação clara de responsabilidades
- Uso de custom hooks para lógica reutilizável

## Próximos Passos e Melhorias Futuras

- Implementação de relatórios avançados
- Integração com sistemas de pagamento
- Aplicativo mobile para acompanhamento em tempo real
- Melhorias de performance para grandes volumes de dados
- Expansão das funcionalidades de análise de dados.

## Suporte e Contato

Para dúvidas, problemas ou sugestões, entre em contato com a equipe de desenvolvimento.

---

*Documentação gerada em 16/05/2025* 