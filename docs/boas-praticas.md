# Boas Práticas de Desenvolvimento

Este documento contém as boas práticas que todos os membros da equipe devem seguir ao trabalhar no projeto.

## Princípios Gerais

1. **Simplicidade:** Sempre busque a solução mais simples e direta para resolver um problema.
2. **Manutenibilidade:** Escreva código que seja fácil de entender e de modificar no futuro.
3. **Reutilização:** Evite duplicação de código. Desenvolva componentes e funções reutilizáveis.
4. **Performance:** Esteja atento a problemas de desempenho e otimize quando necessário.
5. **Segurança:** Considere implicações de segurança em todas as implementações.

## Estrutura do Código

### Organização de Arquivos

- Mantenha arquivos pequenos e focados em uma única responsabilidade.
- Prefira componentes pequenos e compostos a componentes grandes e monolíticos.
- Divida arquivos grandes em módulos menores quando atingirem ~300 linhas.
- Use subdiretórios para organizar recursos relacionados.

### Nomenclatura

- **Arquivos:** Use camelCase para arquivos comuns (utils, hooks) e PascalCase para componentes React.
- **Componentes:** Use nomes descritivos e específicos (ex: `ProductImageUploader` em vez de `Uploader`).
- **Funções:** Use verbos que descrevam a ação (ex: `fetchCustomers`, `updateOrder`).
- **Variáveis:** Use nomes significativos que descrevam o conteúdo (ex: `totalRevenue`).
- **Constantes:** Use UPPER_SNAKE_CASE para constantes globais.

## React e TypeScript

### Componentes

- Prefira componentes funcionais com hooks.
- Divida componentes complexos em subcomponentes reutilizáveis.
- Use o padrão de composição para criar interfaces flexíveis.
- Evite props excessivas - considere agrupar props relacionadas em objetos.
- Isole lógica complexa em custom hooks.

### Tipagem

- Defina tipos explícitos para todas as props de componentes.
- Coloque interfaces e tipos compartilhados nos arquivos em `/src/types`.
- Evite o uso de `any`, prefira `unknown` e depois faça a tipagem adequada.
- Use genéricos para criar componentes e funções flexíveis mas tipados.
- Aproveite a inferência de tipos quando for claro e não ambíguo.

### Estado e Efeitos

- Mantenha o estado o mais local possível.
- Use o Zustand apenas para estado que precisa ser compartilhado entre componentes distantes na árvore.
- Evite múltiplos estados que poderiam ser representados como um único objeto.
- Limite a quantidade de dependências em `useEffect`.
- Evite side-effects desnecessários.

## Gerenciamento de Estado

### Stores do Zustand

- Mantenha as stores focadas e com propósito único.
- Exponha apenas o que for necessário de cada store.
- Use seletores específicos para evitar re-renderizações desnecessárias.
- Documente as funções complexas nas stores.

### Comunicação com API

- Use React Query para requisições de dados.
- Centralize a lógica de chamadas API em funções ou hooks dedicados.
- Trate erros de forma consistente.
- Implemente retentativas para falhas de rede.

## Estilização

### TailwindCSS

- Siga o padrão mobile-first usando classes responsivas.
- Crie componentes para padrões de design recorrentes.
- Evite estilos inline quando possível.
- Use variáveis de cores e tamanhos definidos no tema.

### Componentes shadcn/ui

- Evite modificar os componentes base de shadcn/ui diretamente.
- Crie componentes compostos para necessidades específicas.
- Mantenha a consistência visual usando os mesmos componentes base.

## Qualidade de Código

### Manutenibilidade

- Escreva código auto-documentado com nomes descritivos.
- Adicione comentários apenas para explicar "por quê", não "o quê" ou "como".
- Escreva funções pequenas e com propósito único.
- Isole código complexo em funções utilitárias bem testadas.

### Otimização

- Use React.memo, useMemo e useCallback para componentes e funções que causam re-renderizações frequentes.
- Limite a quantidade de elementos no DOM.
- Otimize imagens e assets estáticos.
- Virtualize listas longas.
- Implemente carregamento preguiçoso (lazy loading) para rotas e componentes pesados.

### Prevenção de Erros

- Valide inputs de usuário antes de enviar para o servidor.
- Trate casos de borda e estados vazio/erro.
- Implemente graceful degradation para funcionalidades que possam falhar.
- Use o padrão Error Boundary para isolar falhas.

## Commits e Pull Requests

### Commits

- Faça commits pequenos e frequentes.
- Use mensagens claras e descritivas seguindo o padrão:
  ```
  tipo(escopo): descrição
  
  corpo opcional
  ```
  Onde `tipo` pode ser: feat, fix, docs, style, refactor, test, chore.

### Pull Requests

- Mantenha PRs pequenos e focados em uma única funcionalidade ou correção.
- Escreva descrições detalhadas explicando o que foi feito e por quê.
- Inclua screenshots para mudanças visuais.
- Solicite revisão de pelo menos um membro da equipe.
- Responda aos comentários e resolva-os antes de mesclar.

## Segurança

- Nunca armazene credenciais ou secrets no código fonte.
- Valide e sanitize todas as entradas de usuário.
- Use HTTPS para todas as chamadas de API.
- Implemente autenticação e autorização adequadas para todas as rotas protegidas.
- Mantenha as dependências atualizadas para evitar vulnerabilidades conhecidas.

## Performance

- Minimize o número de requisições ao servidor.
- Utilize cache efetivamente.
- Otimize o carregamento inicial da aplicação.
- Implemente code-splitting para carregamento sob demanda.
- Monitore e otimize o tamanho do bundle.

## Acessibilidade

- Use elementos semânticos (nav, header, main, etc.).
- Garanta que todos os elementos interativos sejam acessíveis por teclado.
- Forneça textos alternativos para imagens.
- Mantenha contraste adequado entre texto e fundo.
- Teste com leitores de tela e outros recursos de acessibilidade.

---

*Boas práticas atualizadas em 16/05/2025* 