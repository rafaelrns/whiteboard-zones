/**
 * Seed para desenvolvimento: cria um usuário de teste.
 * Rodar: pnpm seed (na raiz) ou pnpm run seed (em apps/api)
 */
import './load-env';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

const TEST_USER = {
  name: 'Usuário Teste',
  email: 'teste@zones.local',
  password: 'senha12345', // mínimo 8 caracteres
};

async function seed() {
  const hash = await bcrypt.hash(TEST_USER.password, 10);
  const existing = await prisma.user.findUnique({ where: { email: TEST_USER.email } });
  if (existing) {
    console.log('Usuário de teste já existe:', TEST_USER.email);
    return;
  }
  await prisma.user.create({
    data: { name: TEST_USER.name, email: TEST_USER.email, password: hash, role: 'owner' },
  });
  console.log('Usuário de teste criado.');
  console.log('  Email:', TEST_USER.email);
  console.log('  Senha:', TEST_USER.password);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
