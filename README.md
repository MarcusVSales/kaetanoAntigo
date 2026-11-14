# 🪑 Kaetano Antigo — Documentação Completa

> Curadoria de móveis e objetos das décadas de 40, 50 e 60.

---

## 📋 Índice

1. [O que é o projeto](#o-que-é-o-projeto)
2. [Estrutura de arquivos](#estrutura-de-arquivos)
3. [Como rodar localmente](#como-rodar-localmente)
4. [Páginas do site](#páginas-do-site)
5. [Painel Admin — como usar](#painel-admin--como-usar)
6. [O que editar antes de publicar](#o-que-editar-antes-de-publicar)
7. [Como subir para produção](#como-subir-para-produção)
8. [Segurança](#segurança)
9. [Solução de problemas](#solução-de-problemas)

---

## O que é o projeto

Site completo de exposição e venda de móveis antigos, com:

- **Site público** — exibição de peças, galeria de fotos, contato via WhatsApp
- **Painel Admin** — cadastro e gestão de produtos, upload de fotos, controle de vendas
- **Financeiro** — tela de vendas com balancete, filtros e exportação para Excel

**Stack:** Next.js 14 · Node.js/Express · SQLite (sql.js) · Tailwind CSS · JWT

---

## Estrutura de arquivos

```
kaetano/
│
├── backend/                         ← Servidor API (Node.js + Express)
│   ├── .env                         ← ⚠️ CONFIGURAÇÕES — edite antes de publicar
│   ├── package.json
│   ├── data/                        ← Banco SQLite (criado automaticamente)
│   ├── uploads/                     ← Fotos dos produtos (criado automaticamente)
│   └── src/
│       ├── server.js                ← Entrada principal do servidor
│       ├── database/
│       │   ├── connection.js        ← Conexão com o banco SQLite
│       │   └── init.js              ← Cria as tabelas e insere exemplos
│       ├── middleware/
│       │   └── auth.js              ← Verificação do token JWT
│       └── routes/
│           ├── auth.js              ← Login e verificação de sessão
│           └── products.js          ← CRUD de produtos e upload de imagens
│
└── frontend/                        ← Site (Next.js + Tailwind CSS)
    ├── .env.local                   ← ⚠️ CONFIGURAÇÕES — edite antes de publicar
    ├── next.config.js               ← Configuração do Next.js
    ├── tailwind.config.js           ← Cores e fontes do tema
    ├── public/
    │   └── images/
    │       ├── placeholder.svg      ← Imagem padrão quando produto não tem foto
    │       └── kaetanohistoria.jpg  ← ⚠️ ADICIONE SUA FOTO aqui (Minha História)
    └── src/
        ├── lib/
        │   └── api.js               ← Todas as chamadas à API centralizadas
        ├── styles/
        │   └── globals.css          ← Estilos globais e componentes CSS
        ├── components/
        │   ├── layout/
        │   │   ├── Header.jsx       ← Cabeçalho com nav, busca e logo
        │   │   ├── Footer.jsx       ← Rodapé com links e contato
        │   │   └── WhatsAppButton.jsx ← Botão flutuante do WhatsApp
        │   └── products/
        │       ├── ProductCard.jsx  ← Card de produto nas listagens
        │       ├── CategoryFilter.jsx ← Botões de filtro por categoria
        │       └── ImageCropper.jsx ← Editor de enquadramento de foto
        └── pages/
            ├── index.js             ← Página inicial (hero + destaques)
            ├── acervo-colecao.js    ← Acervo com busca e filtros
            ├── vendidos.js          ← Peças vendidas
            ├── restauro.js          ← Página de restauro e orçamento
            ├── nossa-historia.js    ← Página pessoal com foto
            ├── contato.js           ← Contato WhatsApp e Instagram
            ├── politicas.js         ← Políticas LGPD e da loja
            ├── produto/[id].js      ← Detalhe da peça com galeria e zoom
            ├── admin/
            │   ├── login.js         ← Login do admin
            │   ├── index.js         ← Painel principal (CRUD de produtos)
            │   └── vendas.js        ← Financeiro e exportação Excel
            ├── _app.js              ← Wrapper global (header/footer/toasts)
            └── _document.js         ← HTML base (fontes Google)
```

---

## Como rodar localmente

### Pré-requisitos
- [Node.js 18+](https://nodejs.org) instalado
- VS Code aberto na pasta `kaetano/`

### 0. Configurar os segredos (só na primeira vez)

```bash
# Windows (PowerShell) — copie os modelos:
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

Abra `backend/.env` e preencha **pelo menos**:

| Variável | O que colocar |
|---|---|
| `JWT_SECRET` | gere com `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` — **gere o seu, não reutilize nenhum valor visto em chat ou documento** |
| `ADMIN_PASSWORD` | sua senha (mín. 10 caracteres, letras e números) — só é usada para criar o admin na 1ª vez |
| `ADMIN_EMAIL` | e-mail que vai receber o link de "Esqueci minha senha" |

> O servidor **se recusa a iniciar** se o `JWT_SECRET` estiver ausente/curto ou se a senha for fraca/conhecida. É proposital.

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run dev
```

(as tabelas são criadas/atualizadas sozinhas ao iniciar — não precisa mais rodar `db:init`)

✅ Deve aparecer:
```
🪑  API → http://localhost:3001
🔒  Helmet + Rate Limiting ativos
    Admin: http://localhost:3000/admin/login
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

✅ Deve aparecer:
```
✓ Ready - Local: http://localhost:3000
```

### Acessar

| O que | URL |
|---|---|
| Site público | http://localhost:3000 |
| Acervo | http://localhost:3000/acervo-colecao |
| Admin | http://localhost:3000/admin/login |
| Vendas | http://localhost:3000/admin/vendas |

| Visitas | http://localhost:3000/admin/visitas |

**Login:** usuário `admin` (ou o definido em `ADMIN_USERNAME`) e a senha que você pôs em `ADMIN_PASSWORD`.
Não existe mais senha padrão. Esqueceu a senha? Use **"Esqueci minha senha"** na tela de login ou rode `npm run admin:set` na pasta `backend`.

---

## Páginas do site

### Públicas

| Página | URL | O que tem |
|---|---|---|
| Início | `/` | Hero com fotos de destaque, grid de peças, CTA WhatsApp |
| Acervo | `/acervo-colecao` | Busca + filtro por categoria + grid de produtos |
| Produto | `/produto/[id]` | Galeria, zoom, miniaturas, botão WhatsApp |
| Vendidos | `/vendidos` | Peças vendidas em preto e branco com busca |
| Restauro | `/restauro` | Política de restauro, cuidados, orçamento WhatsApp |
| Nossa História | `/nossa-historia` | Texto pessoal + foto (edite o arquivo) |
| Contato | `/contato` | WhatsApp e Instagram |
| Políticas | `/politicas` | LGPD e políticas da loja |

### Admin (requer login)

| Página | URL | O que tem |
|---|---|---|
| Login | `/admin/login` | Autenticação |
| Painel | `/admin` | CRUD de produtos, fotos, status |
| Vendas | `/admin/vendas` | Balancete, filtros mês/ano, exportar Excel |
| Visitas | `/admin/visitas` | Quantas pessoas visitaram, por quais telas passaram e por quanto tempo |
| Esqueci a senha | `/admin/esqueci-senha` | Envia link de redefinição para o e-mail do admin |
| Nova senha | `/admin/redefinir-senha` | Tela aberta pelo link do e-mail |
| 404 | (qualquer endereço inexistente) | Página personalizada de "não encontrado" |

---

## Painel Admin — como usar

### Criar produto
1. Clique em **+ Novo Produto**
2. Preencha: nome, categoria, descrição, preço, quantidade, ano do móvel
3. Marque o status: **Visível**, **Destaque** (máx. 7) ou **Vendido**
4. Clique **Criar Produto**

### Adicionar fotos
1. Na linha do produto, clique no ícone de **imagem** 🖼
2. Clique em **+ Adicionar Fotos** (máx. 7 fotos por produto)
3. Para definir qual foto aparece na listagem: clique **☆ Destaque**
4. Para ajustar o enquadramento no hero: clique **✂ Recortar**
   - Arraste e use o zoom para enquadrar o móvel
   - Veja o preview ao vivo (hero 16:9 e card 3:4)
   - Clique **Salvar Enquadramento**

### Marcar como vendido
1. Edite o produto (ícone de lápis)
2. Marque **"Marcar como vendido"**
3. Preencha: **Data da venda** (DD/MM/AAAA), **Valor de venda**, **Forma de pagamento**, **Nome do comprador**, **CPF/CNPJ**
4. Clique **Salvar** — a peça sai do acervo e vai para "Vendidos"

### Desfazer venda
- Na tabela, clique no ícone de **seta circular** ↩ na linha do produto vendido
- A peça volta para o acervo e os dados de venda são apagados

### Filtros rápidos
Clique nos cards de estatística no topo do painel para filtrar:
- **Total** · **Ativos** · **Destaques** · **Vendidos** · **Ocultos**

### Tela de Vendas
- Filtre por **mês** e/ou **ano**
- Veja o balancete agrupado por período
- Clique **Exportar Excel** para baixar a planilha com:
  - Data da venda · Peça · Categoria · Nome do comprador · CPF/CNPJ · Forma de pagamento · Valor

---

## O que editar antes de publicar

### 1. Número do WhatsApp

**`backend/.env`**
```
WHATSAPP_NUMBER=5511965713610
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_WHATSAPP=5511965713610
```

Formato: `55` + DDD + número (sem espaços ou traços).

### 2. Senha do admin, e-mail e segredo

Veja o passo **0** acima. O arquivo `backend/.env` **nunca** deve ir para o GitHub (já está no `.gitignore`).
Não escreva senhas nem o `JWT_SECRET` em README, chat ou qualquer arquivo versionado.

### 2.1 E-mail da recuperação de senha (SMTP)

No `backend/.env`, preencha `SMTP_*`. Com Gmail: ative a verificação em 2 etapas, crie uma **"Senha de app"** em
myaccount.google.com/apppasswords e use-a em `SMTP_PASS` (não use a senha normal da conta).
Sem SMTP configurado, em desenvolvimento o link aparece no terminal do backend; **em produção o e-mail não é enviado**.

### 3. Sua foto — Nossa História

Coloque sua foto em:
```
frontend/public/images/kaetanohistoria.jpg
```
Tamanho recomendado: proporção **3:4** (retrato), mínimo 800×1067px.

### 4. Seu texto — Nossa História

Abra `frontend/src/pages/nossa-historia.js` e substitua os parágrafos com o comentário `← EDITE AQUI`.

### 5. Política de restauro e loja

Abra `frontend/src/pages/restauro.js` e `frontend/src/pages/politicas.js` e substitua os textos marcados com `← EDITE AQUI`.

### 6. Instagram

Nos arquivos `Footer.jsx` e `contato.js`, substitua `@kaetanoantigo` pelo seu @ real.

---

## Como subir para produção

Veja o arquivo **`DEPLOY.md`** para o guia completo passo a passo.

---

## Segurança

O projeto já inclui:

| Proteção | Como funciona |
|---|---|
| **Helmet** | Headers HTTP seguros (XSS, HSTS, etc.) |
| **Rate limiting** | Máx. 200 req/15min por IP · Máx. 10 tentativas de login/15min |
| **JWT seguro** | Token de 8h · algoritmo HS256 · secret de 128 caracteres |
| **bcrypt custo 12** | Senha do admin armazenada com hash seguro |
| **CORS restrito** | Só aceita requisições do frontend autorizado |
| **Upload seguro** | Valida mimetype + extensão · máx. 8MB · máx. 7 fotos por produto |
| **sessionStorage** | Token salvo em sessionStorage (expira ao fechar o browser) |
| **SQL seguro** | Queries preparadas — sem risco de SQL injection |

---

## Solução de problemas

### Imagens não aparecem
- Verifique se o backend está rodando em `localhost:3001`
- Confirme que `NEXT_PUBLIC_API_URL=http://localhost:3001` no `frontend/.env.local`
- Reinicie o frontend após alterar o `.env.local`

### Erro no `npm install` do backend
O projeto usa `sql.js` (JavaScript puro, sem compilação). Se der erro, tente:
```bash
npm cache clean --force
npm install
```

### Admin não loga
- Depois de **5 senhas erradas** a conta é bloqueada por 15 minutos (mesmo com a senha certa). Para liberar na hora use "Esqueci minha senha" ou `npm run admin:set`.
- A senha do `.env` só vale na criação do admin. Para trocar depois: `cd backend && npm run admin:set`.
- O servidor não sobe e mostra "Configuração insegura"? Falta/está curto o `JWT_SECRET` ou a senha é fraca — leia a mensagem, ela diz o que ajustar.

### Porta já em uso
```bash
npx kill-port 3001
npx kill-port 3000
```

### Hero preto / fotos não aparecem no site
- As fotos precisam ser enviadas pelo admin (não basta criar o produto)
- Produtos sem foto não aparecem no hero — envie pelo menos 1 foto
- Para o hero aparecer, o produto precisa estar marcado como **Destaque**

---

## Segurança e privacidade — o que o projeto faz

| Proteção | Detalhe |
|---|---|
| Sem senha padrão | O admin só é criado com a senha que **você** definiu; senhas conhecidas são recusadas |
| Bloqueio de tentativas | 5 erros → conta bloqueada 15 min **e** máx. 10 tentativas/15 min por IP |
| Recuperação por e-mail | Link de uso único, vale 30 min, só o *hash* do token fica no banco; resposta idêntica exista ou não o e-mail |
| Sessões revogáveis | Trocar a senha encerra todas as sessões antigas (token com "versão") |
| Admin protegido | API exige token em toda escrita; telas do admin só aparecem após o servidor validar o login; `noindex` + `robots.txt` |
| Upload seguro | Arquivo é decodificado de verdade (não basta a extensão); redimensionado; sem arquivos órfãos |
| Cabeçalhos | Helmet no backend; `X-Frame-Options`, `nosniff`, `Referrer-Policy` no site |
| Dependências | `npm audit` revisado; Next.js atualizado para a linha 15.5 (a 14.x tinha falha crítica sem correção) |

### Monitor de visitas (LGPD)
Anônimo: **sem cookies, sem IP, sem identificar pessoas**. Registra página, tempo (só com a aba visível), domínio de origem e tipo de aparelho.
Respeita "Não rastrear" do navegador e ignora robôs. Apaga registros com mais de 13 meses. O texto da página **Políticas** já descreve isso.
Seu navegador é marcado para não contar suas visitas ao logar no admin (dá para desligar na tela Visitas).

### Se um segredo já vazou
1. Torne o repositório **Privado** (GitHub → Settings → Danger Zone → Change visibility).
2. Gere um novo `JWT_SECRET` (isso desloga todos) e troque a senha do admin (`npm run admin:set`).
3. Se o repositório precisa continuar público, apague o histórico (veja `DEPLOY.md`, seção "Limpar o GitHub").

---

## Categorias

A lista oficial fica em **dois arquivos** (mantenha iguais):

| Arquivo | Para quê |
|---|---|
| `frontend/src/lib/categories.js` | filtros do acervo, menu do celular e cadastro no admin |
| `backend/src/constants/categories.js` | validação no servidor + tabela de nomes antigos |

Ao iniciar, o servidor renomeia sozinho produtos que ainda usam nomes antigos (ex.: `Buffet` → `Buffets e Aparadores`) e,
**antes** de mexer, guarda uma cópia em `backend/data/kaetano.db.bak-categorias-…`. Só faz isso uma vez.
Categoria fora da lista é recusada pelo servidor.

## Fotos: zoom e enquadramento

- **Cliente** (ao clicar numa foto): zoom de 50% a 400%, arrastar para mover, roda do mouse, teclado (`+` `-` `0`, setas, `Esc`).
- **Admin** (fotos do produto → *Recortar*): zoom de 40% a 400%. Abaixo de 100% a foto fica menor que o quadro e sobra fundo preto em volta;
  os dois previews (computador e celular) mostram exatamente o que vai para a tela inicial.
- Só a **foto principal** do produto aparece no destaque da tela inicial.
