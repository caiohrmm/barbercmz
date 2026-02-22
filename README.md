# BarberCMZ Backend

SaaS multi-tenant de agendamento para barbearias. Backend seguro, escalável e preparado para crescimento regional.

## 🚀 Tecnologias

- Node.js (v20+)
- Express.js
- TypeScript
- MongoDB Atlas (Mongoose)
- JWT (Access + Refresh Token)
- Zod (Validação)
- Pino (Logging)
- Helmet + CORS (Segurança)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Configurar variáveis de ambiente no .env
```

## 🔧 Configuração

Configure as seguintes variáveis no arquivo `.env`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=sua-uri-do-mongodb
JWT_SECRET=seu-secret-jwt-minimo-32-caracteres
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
LOG_LEVEL=info
```

## 🏃 Execução

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start

# Produção com PM2
npm run start:prod
```

## 📁 Estrutura do Projeto

```
src/
  - modules/          # Módulos da aplicação
    - auth/
    - barbershops/
    - users/
    - barbers/
    - services/
    - appointments/
    - customers/
    - plans/
  - middlewares/      # Middlewares customizados
  - utils/            # Utilitários
  - config/           # Configurações
  - app.ts            # Configuração do Express
  - server.ts         # Entry point
```

## 🔐 Segurança

- Helmet para headers de segurança
- CORS configurado para domínios permitidos
- Rate limiting global e por rota
- Validação de inputs com Zod
- JWT com Access Token (15min) e Refresh Token (7d)
- Hash de senha com bcrypt (salt >= 10)
- Middleware de autenticação e autorização
- Isolamento multi-tenant (barbershopId)

## 🏗️ Arquitetura

- **Padrão**: Modular + Clean Architecture
- **Multi-Tenant**: Todas as entidades possuem `barbershopId`
- **Separação**: Controllers, Services e Repositories

## 📝 API Routes

### Auth
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Barbershops
- `POST /barbershops`
- `GET /barbershops/:id`

### Barbers
- `POST /barbers`
- `GET /barbers`
- `PATCH /barbers/:id`
- `DELETE /barbers/:id`

### Services
- `POST /services`
- `GET /services`
- `PATCH /services/:id`
- `DELETE /services/:id`

### Appointments
- `POST /appointments` (público)
- `GET /appointments`
- `PATCH /appointments/:id/status`

### Customers
- `GET /customers`
- `PATCH /customers/:id/block`

## 🧪 Desenvolvimento

```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

## 📄 Licença

ISC

