# 🚀 Kaetano Antigo — Guia de Deploy (Publicação)

Este guia cobre tudo que você precisa para colocar o site no ar de forma profissional.

---

## Escolha a opção que se encaixa melhor

| Opção | Custo | Dificuldade | Ideal para |
|---|---|---|---|
| [Render.com](#opção-1--render--gratuito-recomendado) | Gratuito | ⭐ Fácil | Começar sem custo |
| [Railway.app](#opção-2--railway) | ~$5/mês | ⭐ Fácil | Mais estável |
| [VPS (DigitalOcean / Hostinger)](#opção-3--vps-servidor-próprio) | ~$6-12/mês | ⭐⭐⭐ Avançado | Controle total |

---

## Antes de qualquer opção — Preparação obrigatória

### 1. Criar conta no GitHub (gratuito)

Acesse [github.com](https://github.com) e crie uma conta.

### 2. Subir o projeto para o GitHub

No VS Code, abra o terminal e execute:

```bash
# Na pasta raiz do projeto (kaetano/)
git init
git add .
git commit -m "primeiro commit"
```

Em seguida, crie um repositório novo no GitHub (clique em "New repository"), copie o link e execute:

```bash
git remote add origin https://github.com/SEU_USUARIO/kaetano-antigo.git
git branch -M main
git push -u origin main
```

### 3. Preparar as variáveis de ambiente

Você vai precisar dessas informações na hora do deploy:

**Backend (.env):**
```
PORT=3001
JWT_SECRET=<gere um NOVO: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<senha forte, min. 10 caracteres>
WHATSAPP_NUMBER=5511965713610
FRONTEND_URL=https://SEU_DOMINIO.com
```

**Frontend (.env.local → variáveis de ambiente do serviço):**
```
NEXT_PUBLIC_API_URL=https://kaetano-api.onrender.com  (URL do seu backend)
NEXT_PUBLIC_WHATSAPP=5511965713610
```

---

## Opção 1 — Render (Gratuito, Recomendado)

O Render permite hospedar o backend e o frontend gratuitamente.

> ⚠️ No plano gratuito, o backend "dorme" após 15min sem uso e demora ~30s para acordar na primeira requisição. Para evitar isso, use o Railway ou um VPS.

### Passo 1 — Deploy do Backend

1. Acesse [render.com](https://render.com) e faça login com sua conta do GitHub
2. Clique em **New +** → **Web Service**
3. Conecte o repositório `kaetano-antigo`
4. Configure:
   - **Name:** `kaetano-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Em **Environment Variables**, adicione todas as variáveis do backend listadas acima
6. Clique **Create Web Service**
7. Aguarde o deploy. Anote a URL gerada (ex: `https://kaetano-api.onrender.com`)

### Passo 2 — Deploy do Frontend

1. Clique em **New +** → **Static Site**
2. Conecte o mesmo repositório
3. Configure:
   - **Name:** `kaetano-site`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `.next` *(ou use **Web Service** com `npm start`)*

> **Recomendado:** Use **Web Service** para o frontend também, pois o Next.js tem SSR:
> - **Build Command:** `npm install && npm run build`
> - **Start Command:** `npm start`

4. Adicione as variáveis de ambiente:
   - `NEXT_PUBLIC_API_URL` = URL do backend (ex: `https://kaetano-api.onrender.com`)
   - `NEXT_PUBLIC_WHATSAPP` = `5511965713610`
5. Clique **Create Web Service**
6. Anote a URL do site (ex: `https://kaetano-site.onrender.com`)

### Passo 3 — Conectar os dois

7. Volte nas configurações do **backend**
8. Atualize a variável `FRONTEND_URL` com a URL do frontend
9. Clique **Save Changes** — o backend vai reiniciar automaticamente

### Passo 4 — Testar

- Acesse a URL do frontend no navegador
- Vá em `/admin/login` e faça login com suas credenciais
- Cadastre um produto e veja se aparece no site

---

## Opção 2 — Railway

Railway é mais estável que o Render gratuito. Custa ~$5/mês mas não dorme.

### Deploy do Backend

1. Acesse [railway.app](https://railway.app) e faça login com GitHub
2. Clique em **New Project** → **Deploy from GitHub repo**
3. Selecione o repositório e configure:
   - **Root Directory:** `/backend`
4. Vá em **Variables** e adicione todas as variáveis do backend
5. Vá em **Settings** → **Deploy** e configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Clique em **Deploy** e aguarde. Anote a URL gerada.

### Deploy do Frontend

1. No mesmo projeto Railway, clique em **New** → **GitHub Repo** (mesmo repositório)
2. Configure:
   - **Root Directory:** `/frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. Em **Variables**, adicione:
   - `NEXT_PUBLIC_API_URL` = URL do backend Railway
   - `NEXT_PUBLIC_WHATSAPP` = `5511965713610`
4. Deploy automático.

---

## Opção 3 — VPS (Servidor Próprio)

Para quem quer controle total. Funciona em DigitalOcean, Hostinger VPS, Contabo, etc.

### Requisitos mínimos
- Ubuntu 22.04 LTS
- 1 vCPU, 1GB RAM (mínimo)
- Node.js 18+ instalado
- Domínio próprio (opcional mas recomendado)

### Passo 1 — Conectar ao servidor

```bash
ssh root@IP_DO_SERVIDOR
```

### Passo 2 — Instalar dependências

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Instalar Nginx (proxy reverso)
apt install -y nginx

# Instalar Git
apt install -y git
```

### Passo 3 — Clonar o projeto

```bash
cd /var/www
git clone https://github.com/SEU_USUARIO/kaetano-antigo.git
cd kaetano-antigo
```

### Passo 4 — Configurar e iniciar o Backend

```bash
cd backend

# Criar o arquivo .env com suas configurações reais
nano .env
```

Cole o conteúdo:
```
PORT=3001
JWT_SECRET=<gere um NOVO>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<senha forte>
WHATSAPP_NUMBER=5511965713610
FRONTEND_URL=https://seudominio.com.br
```

```bash
npm install

# Iniciar com PM2 (fica rodando sempre)
pm2 start src/server.js --name kaetano-backend
pm2 save
pm2 startup
```

### Passo 5 — Configurar e iniciar o Frontend

```bash
cd ../frontend

# Criar .env.local
nano .env.local
```

Cole:
```
NEXT_PUBLIC_API_URL=https://seudominio.com.br/api
NEXT_PUBLIC_WHATSAPP=5511965713610
```

```bash
npm install
npm run build

# Iniciar com PM2
pm2 start npm --name kaetano-frontend -- start
pm2 save
```

### Passo 6 — Configurar Nginx

```bash
nano /etc/nginx/sites-available/kaetano
```

Cole a configuração:
```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend (API)
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Imagens uploadadas
    location /uploads/ {
        proxy_pass http://localhost:3001/uploads/;
    }

    client_max_body_size 20M;
}
```

```bash
# Ativar o site
ln -s /etc/nginx/sites-available/kaetano /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Passo 7 — SSL/HTTPS com Certbot (gratuito)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

O Certbot configura o HTTPS automaticamente e renova o certificado sozinho.

### Passo 8 — Verificar se tudo está rodando

```bash
pm2 list                    # Vê os processos rodando
pm2 logs kaetano-backend    # Vê logs do backend
pm2 logs kaetano-frontend   # Vê logs do frontend
```

---

## Domínio próprio

Se você tem um domínio (ex: `kaetanoantigo.com.br`), no painel do registrador (Registro.br, GoDaddy, etc.):

1. Crie um registro **A** apontando para o IP do seu servidor
2. Crie um registro **CNAME** `www` apontando para o domínio principal
3. Aguarde até 24h para propagar

---

## Backup do banco de dados

O banco fica em `backend/data/kaetano.db`. Para fazer backup:

```bash
# Copia o banco para uma pasta de backup
cp /var/www/kaetano-antigo/backend/data/kaetano.db ~/backup-$(date +%Y%m%d).db
```

Recomendado: configure um cron job para fazer backup diário:
```bash
crontab -e
# Adicione a linha:
0 3 * * * cp /var/www/kaetano-antigo/backend/data/kaetano.db ~/backups/kaetano-$(date +\%Y\%m\%d).db
```

---

## Atualizar o site após mudanças

Sempre que fizer alterações no código:

```bash
# No servidor
cd /var/www/kaetano-antigo
git pull origin main

# Se mudou o backend:
cd backend && npm install
pm2 restart kaetano-backend

# Se mudou o frontend:
cd ../frontend && npm install && npm run build
pm2 restart kaetano-frontend
```

---

## Checklist final antes de publicar

- [ ] WhatsApp configurado nos dois `.env`
- [ ] Senha do admin alterada no `backend/.env`
- [ ] JWT_SECRET gerado aleatoriamente (128 chars)
- [ ] Foto `kaetanohistoria.jpg` adicionada em `public/images/`
- [ ] Texto de "Minha História" editado
- [ ] Texto de "Restauro" editado
- [ ] Texto de "Políticas" editado
- [ ] Instagram atualizado no Footer e Contato
- [ ] Produtos cadastrados com fotos
- [ ] Pelo menos 1 produto marcado como Destaque (para o hero aparecer)
- [ ] Testou o site em celular (responsivo)
- [ ] Testou o login do admin
- [ ] Testou o upload de fotos
- [ ] Testou o botão do WhatsApp


---

## Itens obrigatórios para produção (segurança)

Defina no `backend/.env` do servidor (ou nas variáveis do Render/Railway):

```
NODE_ENV=production
FRONTEND_URL=https://seudominio.com.br
ADMIN_EMAIL=seu@email.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@gmail.com
SMTP_PASS=<senha de app do Gmail>
SMTP_FROM="Kaetano Antigo <seu@gmail.com>"
```

- Em produção o servidor **não inicia** se a senha do admin ainda for uma senha conhecida (ex.: a senha antiga que aparecia no README).
- Atrás de Nginx/Render/Railway o backend já confia em 1 proxy (`trust proxy`) para ler o IP real; o Nginx precisa enviar
  `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` (já está no exemplo acima). Sem isso o limite de login não funciona direito.
- **Persistência:** no plano gratuito do Render o disco é apagado a cada deploy — o banco (`backend/data`) e as fotos (`backend/uploads`)
  seriam perdidos. Use um *Persistent Disk* (Render) / *Volume* (Railway) montado em `backend/data` e `backend/uploads`, ou o VPS.
- Faça backup de `backend/data/kaetano.db` e `backend/uploads/` (o banco guarda dados de compradores — proteja o backup).

## Limpar o GitHub (segredos/dados que já foram enviados)

O `.gitignore` agora protege `.env*`, `backend/data` e `backend/uploads`, mas **o que já foi enviado continua no histórico**. Passos:

```bash
# 1) Pare de versionar os arquivos sensíveis (mantém os arquivos no seu computador)
git rm -r --cached backend/data backend/uploads frontend/.env.local
git add .
git commit -m "seguranca: remove dados e segredos do versionamento"

# 2) Opção simples: recomeçar o histórico (o repo tem poucos commits)
git checkout --orphan limpo
git add -A
git commit -m "versao limpa"
git branch -D main
git branch -m main
git push -f origin main
```

Depois **troque o JWT_SECRET e a senha do admin** (os antigos ficaram públicos enquanto o repositório estava aberto) e deixe o repositório **Privado**.
