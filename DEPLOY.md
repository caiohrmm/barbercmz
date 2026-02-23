# Deploy da API BarberCMZ no Render

## 1. Configuração do serviço (Web Service)

Na tela de criação/edição do serviço no Render, use:

| Campo | Valor |
|-------|--------|
| **Name** | `barbercmz` (ou o nome que preferir) |
| **Runtime** | `Node` |
| **Branch** | `main` |
| **Root Directory** | Deixe vazio se o código da API está na raiz do repositório. Se o repositório tem a API numa pasta (ex: `barbercmz`), informe essa pasta. |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/server.js` |

Importante: o **Build Command** precisa rodar `npm run build` para compilar o TypeScript e gerar a pasta `dist/`. Só `npm install` não gera o `dist/server.js`.

---

## 2. Variáveis de ambiente (Environment)

No Render: **Environment** (menu do serviço) → **Add Environment Variable**.

### Obrigatórias

| Variável | Exemplo / Descrição |
|----------|----------------------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/barbercmz?retryWrites=true&w=majority` |
| `JWT_SECRET` | String com **no mínimo 32 caracteres** (ex: uma chave longa e aleatória para produção) |
| `CORS_ORIGIN` | URL do frontend (ex: `https://seu-app.onrender.com` ou `https://seudominio.com`). Várias origens: `https://site1.com,https://site2.com` |

### Opcionais (com valor padrão no código)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NODE_ENV` | `development` | Use `production` no Render. |
| `PORT` | `3000` | O Render define automaticamente; não é obrigatório configurar. |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Validade do access token. |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Validade do refresh token. |
| `LOG_LEVEL` | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace`. |

### Opcionais (upload de logo – Cloudinary)

Se usar upload de logo da barbearia:

| Variável | Descrição |
|----------|-----------|
| `CLOUDINARY_CLOUD_NAME` | Nome do cloud no Cloudinary |
| `CLOUDINARY_API_KEY` | API Key |
| `CLOUDINARY_API_SECRET` | API Secret |

---

## 3. Resumo rápido

1. **Build Command:** `npm install && npm run build`  
2. **Start Command:** `node dist/server.js`  
3. Definir no Environment: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN` (e `NODE_ENV=production`).  
4. Após o deploy, a URL será algo como `https://barbercmz.onrender.com`. Use essa URL no frontend em `NEXT_PUBLIC_API_URL` (ou equivalente) e inclua no `CORS_ORIGIN` se o frontend estiver em outro domínio.

---

## 4. Plano gratuito (free tier)

No plano gratuito o Render pode “adormecer” o serviço após inatividade; a primeira requisição pode demorar mais (cold start). Para evitar isso, use um plano pago ou um cron externo que chame o endpoint `/health` periodicamente.
