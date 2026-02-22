# BarberCMZ Backend

Backend de um sistema SaaS multi-tenant de agendamento para barbearias. Desenvolvido com foco em segurança, escalabilidade e boas práticas de arquitetura.

## 📖 Sobre o Projeto

Este é um **projeto de estudo** desenvolvido com o objetivo de expandir o portfólio e demonstrar habilidades em desenvolvimento backend com Node.js, TypeScript e arquitetura de software.

O projeto foi construído seguindo princípios de **Clean Architecture** e **Multi-Tenancy**, preparado para escalar e suportar múltiplas barbearias de forma isolada e segura.

### 🎯 Objetivo Futuro

Embora seja inicialmente um projeto de estudo, o **BarberCMZ** foi projetado com a visão de se tornar um **SaaS real** para atender barbearias da região, oferecendo uma solução completa de gestão de agendamentos, clientes e serviços.

A arquitetura foi pensada para suportar crescimento gradual, desde algumas barbearias até centenas, sem necessidade de reestruturação significativa.

## 🚀 Stack Tecnológica

### Core
- **Node.js** (v20+) - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **MongoDB Atlas** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB

### Segurança & Autenticação
- **JWT** - Access Token (15min) + Refresh Token (7d)
- **bcrypt** - Hash de senhas (salt 10)
- **Helmet** - Headers de segurança
- **CORS** - Configuração de origens permitidas
- **express-rate-limit** - Proteção contra abuso

### Validação & Logging
- **Zod** - Validação de schemas
- **Pino** - Logging estruturado
- **pino-http** - Middleware de logging HTTP

### Process Manager
- **PM2** - Gerenciamento de processos (produção)

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

### Implementações de Segurança
- ✅ **Helmet** - Headers de segurança HTTP
- ✅ **CORS** - Configuração restrita de origens permitidas
- ✅ **Rate Limiting** - Global (100 req/15min) e específico para appointments (5 req/15min)
- ✅ **Validação Zod** - Todos os inputs validados antes do processamento
- ✅ **JWT** - Access Token (15min) + Refresh Token em cookie httpOnly (7d)
- ✅ **bcrypt** - Hash de senhas com salt 10
- ✅ **Autenticação** - Middleware obrigatório em rotas protegidas
- ✅ **Autorização** - Controle de acesso por roles (owner/barber)
- ✅ **Multi-Tenancy** - Isolamento completo de dados por barbearia

### Princípios Aplicados
- **Nunca confiar em dados do frontend** - Toda validação no backend
- **Defesa em profundidade** - Múltiplas camadas de segurança
- **Princípio do menor privilégio** - Acesso apenas ao necessário

## 🏗️ Arquitetura

### Padrão de Design
- **Modular + Clean Architecture**: Separação clara de responsabilidades
- **Multi-Tenant**: Isolamento completo de dados por barbearia
- **Separação de Camadas**: Controllers → Services → Models

### Multi-Tenancy
O sistema implementa isolamento completo de dados através do `barbershopId`:
- Todas as entidades possuem `barbershopId`
- Nenhuma query retorna dados sem filtrar por `barbershopId`
- Middleware valida `barbershopId` no token JWT
- Impossível acessar dados de outra barbearia

### Estrutura Modular
Cada módulo segue o padrão:
- `*.schemas.ts` - Validação com Zod
- `*.service.ts` - Lógica de negócio
- `*.controller.ts` - Controllers HTTP
- `*.routes.ts` - Definição de rotas
- `*.model.ts` - Modelos Mongoose

## 📝 API Routes

### 🔐 Autenticação
- `POST /auth/login` - Login de usuário
- `POST /auth/refresh` - Renovar access token
- `POST /auth/logout` - Logout

### 🏪 Barbearias
- `POST /barbershops` - Criar nova barbearia (cria owner automaticamente)
- `GET /barbershops/:id` - Buscar barbearia por ID

### 💇 Barbeiros
- `POST /barbers` - Criar barbeiro (requer auth)
- `GET /barbers` - Listar barbeiros (requer auth)
- `PATCH /barbers/:id` - Atualizar barbeiro (requer auth)
- `DELETE /barbers/:id` - Deletar barbeiro (soft delete, requer auth)

### ✂️ Serviços
- `POST /services` - Criar serviço (requer auth)
- `GET /services` - Listar serviços (requer auth)
- `PATCH /services/:id` - Atualizar serviço (requer auth)
- `DELETE /services/:id` - Deletar serviço (soft delete, requer auth)

### 📅 Agendamentos
- `POST /appointments` - Criar agendamento (**público**, com rate limit)
- `GET /appointments` - Listar agendamentos (requer auth)
- `PATCH /appointments/:id/status` - Atualizar status (requer auth)

### 👥 Clientes
- `GET /customers` - Listar clientes (requer auth)
- `PATCH /customers/:id/block` - Bloquear/desbloquear cliente (requer auth)

## 🧪 Desenvolvimento

```bash
# Verificar tipos TypeScript
npm run type-check

# Linting
npm run lint

# Modo desenvolvimento (watch mode)
npm run dev
```

## 📋 Regras de Negócio Implementadas

- ✅ Impedir agendamento se cliente estiver bloqueado
- ✅ Limite de 2 agendamentos ativos por cliente
- ✅ Verificação de conflito de horário antes de criar agendamento
- ✅ Respeitar limite de barbeiros baseado no plano
- ✅ Isolamento de dados - barbeiro não acessa dados de outra barbearia
- ✅ Bloqueio automático de cliente se `noShowCount >= 2`
- ✅ Criação automática de cliente ao agendar (se não existir)

## 🚀 Preparação para o Futuro

O sistema foi projetado pensando em crescimento e expansão:

- 📱 **SMS Integration** - Estrutura preparada para verificação via SMS
- 💳 **Stripe Integration** - Preparado para planos pagos e assinaturas
- 📞 **WhatsApp Business API** - Estrutura para integração futura
- 📊 **Analytics** - Base para relatórios e métricas
- 🔔 **Notificações** - Sistema preparado para notificações push/email

## 📊 Status do Projeto

- ✅ Autenticação e Autorização
- ✅ CRUD de Barbearias
- ✅ CRUD de Barbeiros
- ✅ CRUD de Serviços
- ✅ Sistema de Agendamentos
- ✅ Gestão de Clientes
- ✅ Sistema de Planos (estrutura)
- ✅ Multi-Tenancy completo
- ✅ Validações e Regras de Negócio
- ✅ Logging estruturado
- ✅ Tratamento de erros

## 📄 Licença

ISC

---

**Desenvolvido como projeto de estudo para portfólio** | Potencial para se tornar SaaS regional

