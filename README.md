# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/9247a420-8900-45c3-893e-66009eec0b0d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9247a420-8900-45c3-893e-66009eec0b0d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9247a420-8900-45c3-893e-66009eec0b0d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Sincronização com o Banco de Dados

### Corrigindo problemas de sincronização com o Supabase

Se você estiver enfrentando problemas para visualizar envios salvos no seu aplicativo ou com a sincronização entre o aplicativo e o banco de dados Supabase, siga estas etapas:

1. Verifique se todas as tabelas necessárias existem no Supabase:
   - Acesse o painel administrativo do Supabase (https://app.supabase.com)
   - Navegue até o seu projeto > SQL Editor
   - Execute o script SQL localizado em `src/sql/check_tables.sql` para verificar e criar as tabelas necessárias

2. Reinicie seu aplicativo e atualize a conexão com o Supabase:
   - No aplicativo, navegue até a página de Envios
   - Clique no botão "Atualizar dados" para forçar uma nova sincronização

3. Verifique se as chaves de API do Supabase estão configuradas corretamente:
   - As chaves do Supabase podem ser encontradas no painel do Supabase em "Configurações do Projeto" > "API"
   - Certifique-se de que as chaves corretas estão definidas nas variáveis de ambiente do seu aplicativo

### Estrutura do Banco de Dados

O sistema utiliza duas tabelas principais para gerenciar envios:

- `shipments`: Armazena informações básicas de cada envio (id, nome, data de criação)
- `shipment_customers`: Armazena as associações entre envios e clientes

Observação: O aplicativo agora filtra automaticamente a lista de clientes disponíveis para envio, mostrando apenas aqueles com pedidos pendentes.
