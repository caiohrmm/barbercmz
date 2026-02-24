/**
 * Cria uma barbearia + dono (owner).
 * Como não há rota pública de registro, use este script para cadastrar barbearias.
 *
 * Uso:
 *   npx tsx src/scripts/create-barbershop.ts "Nome da Barbearia" "Nome do Dono" "email@exemplo.com" "senha123"
 *   npx tsx src/scripts/create-barbershop.ts "Nome da Barbearia" "Nome do Dono" "email@exemplo.com" "senha123" --slug=meu-slug
 *
 * Opcional: --slug=xxx (senão o slug é gerado a partir do nome).
 * Senha: pode usar variável de ambiente OWNER_PASSWORD em vez de passar no comando.
 *
 * Pré-requisito: planos existentes no banco (npm run seed:plans). Nova barbearia recebe plano Básico por padrão.
 */

import '../config/env';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { barbershopService } from '../modules/barbershops/barbershop.service';
import logger from '../utils/logger';

function parseArgs(): {
  name: string;
  slug?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
} {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const slugArg = process.argv.find((a) => a.startsWith('--slug='));
  const slug = slugArg ? slugArg.replace('--slug=', '').trim() : undefined;

  const envPassword = process.env.OWNER_PASSWORD;

  if (args.length < 4 && !envPassword) {
    console.error('Uso: npx tsx src/scripts/create-barbershop.ts "Nome da Barbearia" "Nome do Dono" "email@exemplo.com" "senha123" [--slug=meu-slug]');
    console.error('Ou defina OWNER_PASSWORD no ambiente e passe apenas: "Nome" "Dono" "email"');
    process.exit(1);
  }

  const name = args[0]?.trim();
  const ownerName = args[1]?.trim();
  const ownerEmail = args[2]?.trim();
  const ownerPassword = (args[3]?.trim() || envPassword) as string;

  if (!name || !ownerName || !ownerEmail || !ownerPassword) {
    console.error('Nome da barbearia, nome do dono, e-mail e senha são obrigatórios.');
    process.exit(1);
  }

  if (ownerPassword.length < 6) {
    console.error('A senha deve ter no mínimo 6 caracteres.');
    process.exit(1);
  }

  return { name, slug, ownerName, ownerEmail, ownerPassword };
}

async function main(): Promise<void> {
  const { name, slug, ownerName, ownerEmail, ownerPassword } = parseArgs();

  await connectDatabase();

  try {
    const barbershop = await barbershopService.create({
      name,
      slug,
      ownerName,
      ownerEmail,
      ownerPassword,
    });

    logger.info(
      {
        barbershopId: barbershop.id,
        slug: barbershop.slug,
      },
      'Barbearia criada com sucesso'
    );

    console.log('\n--- Barbearia criada ---');
    console.log('ID:', barbershop.id);
    console.log('Nome:', barbershop.name);
    console.log('Slug:', barbershop.slug);
    console.log('Plano (max barbeiros):', barbershop.maxBarbers);
    console.log('\nO dono pode fazer login no painel com o e-mail informado.');
    console.log('Página pública de agendamento: /[slug] =>', `/${barbershop.slug}`);
    console.log('');
  } catch (err) {
    logger.error(err, 'Erro ao criar barbearia');
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }

  process.exit(0);
}

main();
