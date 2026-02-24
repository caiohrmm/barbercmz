# BarberCMZ Backend

Backend da API do **BarberCMZ**: SaaS multi-tenant de agendamento para barbearias. Inclui gestão de barbearias, planos, assinaturas (trial/ativo/suspenso), pagamentos, barbeiros, serviços, clientes e agendamentos públicos (com reCAPTCHA).

**API em produção:** [https://barbercmz.onrender.com](https://barbercmz.onrender.com)

---

## Índice

- [Sobre o projeto](#-sobre-o-projeto)
- [Stack tecnológica](#-stack-tecnológica)
- [Instalação e configuração](#-instalação-e-configuração)
- [Execução](#-execução)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Segurança](#-segurança)
- [Arquitetura e multi-tenancy](#-arquitetura-e-multi-tenancy)
- [API – Rotas completas](#-api--rotas-completas)
- [Modelos de dados](#-modelos-de-dados)
- [Middlewares](#-middlewares)
- [Regras de negócio](#-regras-de-negócio)
- [Fluxo: novo usuário (barbearia)](#-fluxo-novo-usuário-barbearia)
- [Fluxo: cliente que agenda](#-fluxo-cliente-que-agenda)
- [Planos, assinatura e pagamentos](#-planos-assinatura-e-pagamentos)
- [Scripts](#-scripts)
- [Status do projeto](#-status-do-projeto)

---

## 📖 Sobre o projeto

Projeto de estudo com foco em **Clean Architecture** e **multi-tenancy**, preparado para escalar e suportar múltiplas barbearias de forma isolada e segura.

- **Objetivo:** Demonstrar backend Node.js/TypeScript e servir de base para um SaaS real para barbearias (agendamento, clientes, planos, faturamento).
- **Isolamento:** Todas as entidades são filtradas por `barbershopId`; o token JWT carrega `barbershopId` e `role` (owner/barber) para autorização.

---

## 🚀 Stack tecnológica

| Área | Tecnologia |
|------|------------|
| **Core** | Node.js (v20+), Express.js, TypeScript |
| **Banco** | MongoDB Atlas, Mongoose |
| **Auth** | JWT (access 15min, refresh 7d em cookie httpOnly), bcrypt (salt 10) |
| **Segurança** | Helmet, CORS, express-rate-limit (global + appointments) |
| **Validação** | Zod (schemas em todos os inputs) |
| **Logging** | Pino, pino-http |
| **Upload** | Multer (memória), Cloudinary (logo em WebP) |
| **Integrações** | reCAPTCHA v2 (agendamento público), Twilio (SMS – opcional, fluxo alternativo) |

---

## 📦 Instalação e configuração

```bash
npm install
cp .env.example .env
# Editar .env com suas variáveis
```

### Variáveis de ambiente (.env)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `NODE_ENV` | Sim | `development` \| `production` \| `test` |
| `PORT` | Sim | Porta do servidor (ex.: 3000) |
| `MONGODB_URI` | Sim | URI do MongoDB (Atlas ou local) |
| `JWT_SECRET` | Sim | Chave JWT (mín. 32 caracteres) |
| `JWT_ACCESS_EXPIRES_IN` | Não | Ex.: `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Não | Ex.: `7d` |
| `CORS_ORIGIN` | Sim | Origens permitidas separadas por vírgula |
| `LOG_LEVEL` | Não | `info`, `debug`, etc. |
| `CLOUDINARY_CLOUD_NAME` | Logo | Para upload de logo (Cloudinary) |
| `CLOUDINARY_API_KEY` | Logo | |
| `CLOUDINARY_API_SECRET` | Logo | |
| `RECAPTCHA_SECRET_KEY` | Agendamento | Chave secreta reCAPTCHA (agendamento público) |
| `TWILIO_ACCOUNT_SID` | SMS (opcional) | Para fluxo de verificação por SMS |
| `TWILIO_AUTH_TOKEN` | SMS (opcional) | |
| `TWILIO_PHONE_NUMBER` | SMS (opcional) | |

Sem `RECAPTCHA_SECRET_KEY`, a criação pública de agendamentos falha. Sem Cloudinary, o upload de logo falha.

---

## 🏃 Execução

```bash
npm run dev        # Desenvolvimento (tsx watch)
npm run build      # Compila TypeScript
npm start          # Produção (node dist/server.js)
npm run start:prod # PM2
npm run type-check # Verificação de tipos
npm run lint       # ESLint
```

---

## 📁 Estrutura do projeto

```
src/
├── app.ts                    # Express, middlewares globais, montagem de rotas
├── server.ts                 # Entry point (listen)
├── config/
│   ├── env.ts                # Validação Zod das variáveis de ambiente
│   ├── database.ts           # Conexão Mongoose
│   ├── security.ts           # Helmet, CORS, rate limit global e de appointments
│   └── multer.ts             # Upload em memória (logo)
├── middlewares/
│   ├── auth.middleware.ts           # authenticate, authorize(roles)
│   ├── validate.middleware.ts       # Validação Zod (body/query/params)
│   ├── validateBarbershopOwner.middleware.ts  # req.params.id === req.barbershopId
│   ├── requireActiveSubscription.middleware.ts # Bloqueia se subscription não active/trial
│   └── checkBarberLimit.middleware.ts         # Impede criar barbeiro além do plano
├── modules/
│   ├── auth/                 # Login, refresh, logout
│   ├── barbershops/          # CRUD público (criar), GET por id/slug, PATCH (owner), logo, serviços/barbeiros/slots públicos
│   ├── plans/                # GET /plans (público), models Plan, Subscription, Payment
│   ├── subscriptions/        # GET /me, PATCH /me/plan (troca de plano)
│   ├── payments/             # GET /me (lista pagamentos), POST /mock (dev)
│   ├── barbers/              # CRUD (auth + subscription ativa + limite por plano)
│   ├── services/             # CRUD (auth + subscription ativa)
│   ├── customers/            # GET (lista), PATCH /:id/block (auth + subscription ativa)
│   ├── appointments/         # POST (público + captcha), request-verification/verify (SMS), GET/PATCH (auth + subscription)
│   └── users/                # Model User (uso interno)
├── services/
│   ├── cloudinary.service.ts # Upload e conversão para WebP
│   ├── recaptcha.service.ts  # Verificação do token reCAPTCHA
│   └── sms.service.ts       # Envio de SMS (Twilio)
├── utils/
│   ├── errors.ts             # AppError, BadRequestError, ConflictError, etc.
│   ├── logger.ts
│   ├── jwt.ts                # Geração e verificação de tokens
│   └── password.ts           # Hash/comparar senha (bcrypt)
└── scripts/
    ├── seed-plans.ts         # Cria planos Básico, Crescimento, Equipe
    ├── create-barbershop.ts  # Cria barbearia + owner (CLI)
    └── assign-basico-plan.ts # Atribui plano Básico a barbearias sem plano
```

---

## 🔐 Segurança

- **Helmet** – Headers de segurança HTTP  
- **CORS** – Origens permitidas via `CORS_ORIGIN`  
- **Rate limit global** – 100 req/15 min por IP  
- **Rate limit em appointments** – 5 req/15 min para criação e verificação (evitar abuso)  
- **Zod** – Validação de body/query/params em todas as rotas que recebem input  
- **JWT** – Access token no header `Authorization`; refresh em cookie httpOnly  
- **bcrypt** – Hash de senha no cadastro e comparação no login  
- **Autenticação** – Rotas protegidas usam `authenticate`  
- **Autorização** – `authorize('owner')` ou `authorize('owner','barber')` conforme a rota  
- **Multi-tenancy** – Dados sempre filtrados por `barbershopId` do token (ou parâmetro validado)  
- **reCAPTCHA** – Token obrigatório na criação pública de agendamento  

---

## 🏗️ Arquitetura e multi-tenancy

- **Padrão:** Controllers → Services → Models; validação em schemas Zod antes do controller.  
- **Multi-tenancy:**  
  - Entidades: Barbershop, User, Barber, Service, Customer, Appointment, Subscription, Payment.  
  - Todas (exceto User/Barbershop na criação) têm `barbershopId`.  
  - Rotas autenticadas usam `req.barbershopId` (do JWT); nunca confiam em body/query para barbershop.  
  - `validateBarbershopOwner`: garante que `req.params.id` seja a barbearia do usuário quando aplicável.  

---

## 📝 API – Rotas completas

Base URL: `/` (ex.: `https://barbercmz.onrender.com`).

### Health

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Status da API e ambiente |

### Autenticação (`/auth`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/login` | Não | Login (email, password) → accessToken + user |
| POST | `/auth/refresh` | Cookie | Renova accessToken (refresh em cookie) |
| POST | `/auth/logout` | Cookie | Invalida refresh (limpa cookie) |

### Barbearias (`/barbershops`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/barbershops` | Não | Criar barbearia + owner; opcional `planId` (cria subscription trial 30 dias) |
| GET | `/barbershops/slug/:slug` | Não | Buscar por slug (página pública) |
| GET | `/barbershops/:id` | Não* | Buscar por ID (dashboard usa com token) |
| PATCH | `/barbershops/:id` | Owner | Atualizar nome e/ou slug (slug único entre barbearias) |
| POST | `/barbershops/:id/logo` | Owner | Upload de logo (multipart); Cloudinary WebP |
| GET | `/barbershops/:id/services` | Não | Listar serviços ativos (agendamento público) |
| GET | `/barbershops/:id/barbers` | Não | Listar barbeiros ativos (id + nome) |
| GET | `/barbershops/:id/available-slots` | Não | Slots disponíveis (query: date, serviceId, barberId opcional) |

### Planos (`/plans`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/plans` | Não | Listar planos ativos (para pricing e cadastro) |

### Assinaturas (`/subscriptions`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/subscriptions/me` | Sim | Subscription atual da barbearia (trial vencido → suspended on read) |
| PATCH | `/subscriptions/me/plan` | Owner | Trocar plano (body: planId); valida downgrade (limite de barbeiros) |

### Pagamentos (`/payments`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/payments/me` | Owner | Listar pagamentos da subscription atual |
| POST | `/payments/mock` | Owner | Criar pagamento de teste (apenas em desenvolvimento) |

### Barbeiros (`/barbers`)

Todas as rotas: `authenticate` + `authorize('owner','barber')` + `requireActiveSubscription`.

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/barbers` | Criar barbeiro (checkBarberLimit: respeita maxBarbers do plano) |
| GET | `/barbers` | Listar barbeiros da barbearia |
| PATCH | `/barbers/:id` | Atualizar barbeiro |
| DELETE | `/barbers/:id` | Soft delete (active: false) |

### Serviços (`/services`)

Todas: auth + subscription ativa.

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/services` | Criar serviço |
| GET | `/services` | Listar serviços |
| PATCH | `/services/:id` | Atualizar (incl. active) |
| DELETE | `/services/:id` | Soft delete |

### Clientes (`/customers`)

Todas: auth + subscription ativa.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/customers` | Listar (query: blocked, search) |
| PATCH | `/customers/:id/block` | Bloquear/desbloquear (body: blocked) |

### Agendamentos (`/appointments`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/appointments/request-verification` | Não | Solicitar código SMS (rate limit); retorna verificationId |
| POST | `/appointments/verify` | Não | Verificar código e criar agendamento (fluxo SMS alternativo) |
| POST | `/appointments` | Não | Criar agendamento (body inclui captchaToken); rate limit |
| GET | `/appointments` | Sim + subscription | Listar (query: status, barberId, customerId, startDate, endDate) |
| PATCH | `/appointments/:id/status` | Sim + subscription | Atualizar status (scheduled \| completed \| cancelled \| no_show) |

---

## 📊 Modelos de dados

- **User:** name, email, passwordHash, role (owner \| barber), barbershopId, active.  
- **Barbershop:** name, slug (único), logoUrl, planId, currentSubscriptionId, maxBarbers, active.  
- **Plan:** name, priceMonthly, maxBarbers, features[], active.  
- **Subscription:** barbershopId, planId, status (active \| trial \| suspended \| cancelled), currentPeriodStart/End, trialEndsAt, externalSubscriptionId.  
- **Payment:** barbershopId, subscriptionId, amount, currency, status (paid \| pending \| failed \| refunded), paymentMethod (pix \| card \| boleto), paidAt, externalPaymentId.  
- **Barber:** name, workingHours[], unavailableDates[], barbershopId, active.  
- **Service:** name, duration (min), price, barbershopId, active.  
- **Customer:** name, phone, barbershopId, noShowCount, blocked.  
- **Appointment:** barbershopId, barberId, serviceId, customerId, startTime, endTime, status.  
- **PendingVerification:** usado no fluxo SMS (request-verification → verify).  

---

## 🛡️ Middlewares

- **authenticate** – Extrai JWT do header, preenche `req.userId`, `req.barbershopId`, `req.role`.  
- **authorize(...roles)** – Retorna 403 se `req.role` não estiver em roles.  
- **validate(schema)** – Valida body/query/params com Zod; 400 com detalhes em caso de erro.  
- **validateBarbershopOwner** – Exige `req.params.id === req.barbershopId` (uso em PATCH barbershop, logo).  
- **requireActiveSubscription** – Carrega subscription da barbearia, aplica `refreshTrialExpiry`; se status não for active nem trial, responde 403.  
- **checkBarberLimit** – Antes de criar barbeiro, verifica se quantidade de barbeiros ativos já atingiu `maxBarbers` do plano (trial vencido conta como inativo).  

---

## 📋 Regras de negócio

- **Barbearia:** Slug único; ao criar com `planId` é criada Subscription em trial (30 dias).  
- **Trial:** Na leitura da subscription, se status for trial e `trialEndsAt < now`, status é atualizado para suspended (on read, sem cron).  
- **Assinatura:** Rotas de painel (barbers, services, customers, appointments GET/PATCH) exigem subscription active ou trial; caso contrário 403.  
- **Troca de plano:** Apenas owner; em downgrade, se quantidade de barbeiros ativos > maxBarbers do novo plano, retorna 400 com mensagem clara.  
- **Barbeiros:** Não pode criar barbeiro além do `maxBarbers` do plano (considerando trial expirado como inativo).  
- **Agendamento (criação pública):**  
  - reCAPTCHA obrigatório.  
  - Barbearia/barbeiro/serviço ativos; data entre hoje e +20 dias.  
  - Cliente bloqueado não pode agendar.  
  - Máximo 2 agendamentos em aberto (scheduled) por cliente na mesma barbearia.  
  - Conflito de horário: mesmo barbeiro, mesmo período (scheduled) não permitido.  
  - Cliente criado ou atualizado (nome) se telefone já existir.  
- **Status do agendamento:** Ao marcar como `no_show`, incrementa `customer.noShowCount`; se `noShowCount >= 2`, cliente é bloqueado automaticamente.  

---

## 🔄 Fluxo: novo usuário (barbearia)

1. **Frontend:** Usuário acessa página de planos ou “Criar barbearia”.  
2. **Cadastro (POST /barbershops):**  
   - Body: nome da barbearia, slug (opcional), **planId** (opcional), nome do dono, email, senha.  
   - Backend: valida slug único e email único; se `planId` informado, valida plano ativo; inicia transação:  
     - Cria **Barbershop** (name, slug, planId, maxBarbers do plano).  
     - Cria **User** (owner, role: owner, barbershopId).  
     - Se houver plano: cria **Subscription** (status: trial, trialEndsAt = hoje + 30 dias), associa em `barbershop.currentSubscriptionId`.  
     - Commit.  
3. **Frontend:** Redireciona para login com mensagem de sucesso.  
4. **Login (POST /auth/login):** Email e senha → accessToken + user (id, name, email, role, barbershopId).  
5. **Dashboard:** Frontend usa token em todas as requisições. GET /subscriptions/me, GET /barbershops/:id, etc. Enquanto status for trial ou active, todas as telas do painel (barbeiros, serviços, clientes, agenda, faturamento) são acessíveis.  
6. **Após 30 dias:** Na próxima leitura da subscription (ex.: GET /subscriptions/me ou ao acessar rota com requireActiveSubscription), o backend aplica `refreshTrialExpiry`: se trial e trialEndsAt &lt; now, atualiza para **suspended**. O frontend mostra tela “Assinatura expirada” e permite apenas acessar faturamento e “Escolher plano e reativar” (troca de plano sem pagamento integrado ainda).  

---

## 🔄 Fluxo: cliente que agenda

1. **Página pública:** Cliente acessa a URL da barbearia (ex.: `https://app.exemplo.com/minha-barbearia`). O frontend chama **GET /barbershops/slug/minha-barbearia** para dados da barbearia e **GET /barbershops/:id/services** e **GET /barbershops/:id/barbers** para serviços e barbeiros.  
2. **Escolha de data/serviço/barbeiro:** Frontend chama **GET /barbershops/:id/available-slots?date=YYYY-MM-DD&serviceId=...&barberId=...** (barberId opcional) e exibe horários disponíveis.  
3. **Formulário:** Cliente preenche nome, telefone (E.164), escolhe horário; frontend obtém token reCAPTCHA.  
4. **Criar agendamento (POST /appointments):**  
   - Body: barbershopId, barberId, serviceId, customerName, customerPhone, startTime (ISO), **captchaToken**.  
   - Backend: valida reCAPTCHA; valida barbearia/barbeiro/serviço ativos e data no range permitido; busca ou cria **Customer** (por telefone); verifica se cliente não está bloqueado; verifica limite de 2 agendamentos em aberto; verifica conflito de horário; calcula endTime pela duração do serviço; cria **Appointment** (status: scheduled).  
5. **Confirmação:** Frontend exibe confirmação; a barbearia vê o agendamento no painel (GET /appointments).  
6. **Alternativa (SMS):** Fluxo opcional: POST /appointments/request-verification (envia código SMS) → cliente informa código → POST /appointments/verify (verificationId + code) → cria agendamento e remove pending verification.  

---

## 💳 Planos, assinatura e pagamentos

- **Planos:** Seed com Básico (1 barbeiro), Crescimento (5), Equipe (99). GET /plans retorna planos ativos.  
- **Status da subscription:** trial \| active \| suspended \| cancelled. Trial expirado é tratado como suspended (atualizado on read).  
- **Troca de plano (PATCH /subscriptions/me/plan):** Apenas owner; em downgrade valida quantidade de barbeiros ativos; atualiza Subscription.planId e Barbershop.planId + Barbershop.maxBarbers.  
- **Pagamentos:** GET /payments/me lista pagamentos da subscription atual. POST /payments/mock (apenas em desenvolvimento) cria um pagamento de teste para a subscription. Model Payment preparado para futura integração (Stripe, etc.).  

---

## 🧪 Scripts

```bash
npm run seed:plans      # Cria/atualiza planos Básico, Crescimento, Equipe
npm run create:barbershop  # CLI: cria barbearia + owner (pede nome, slug, plano, etc.)
npm run assign:basico   # Atribui plano Básico a barbearias sem planId
```

---

## 📊 Status do projeto

- Autenticação (JWT, refresh, logout)  
- CRUD de barbearias (criar, GET por id/slug, PATCH nome/slug, upload logo)  
- Planos e assinaturas (trial 30 dias, suspended on read, troca de plano)  
- Pagamentos (lista + mock em dev)  
- CRUD de barbeiros (com limite por plano)  
- CRUD de serviços  
- CRUD de clientes (lista, bloquear/desbloquear)  
- Agendamentos (criação pública com reCAPTCHA, fluxo SMS opcional, lista e atualização de status no painel)  
- Regras: cliente bloqueado, máximo 2 agendamentos em aberto, conflito de horário, no-show e bloqueio automático  
- Multi-tenancy e middlewares de autorização e subscription  
- Validação Zod e logging estruturado  

---

## 📄 Licença

ISC

**Links**

- API (produção): [https://barbercmz.onrender.com](https://barbercmz.onrender.com)  
- Frontend (produção): [https://barbercmz-frontend.vercel.app](https://barbercmz-frontend.vercel.app/)
