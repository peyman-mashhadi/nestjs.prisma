import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const peyman = await prisma.user.upsert({
    where: { email: 'peyman.mashhadi@gmail.com' },
    update: { name: 'peyman' },
    create: {
      email: 'peyman.mashhadi@gmail.com',
      name: 'Peyman',
      is_admin: true,
      email_confirmed: true,
      credentials: {
        create: {
          hash: '$2b$10$Cgx0oj8jbiP8ycDV9pSie.rqzaQ./jmfu20byGSGQKeUALWUneLCu', // Peyman12345678
        },
      },
    },
  });
  const bahram = await prisma.user.upsert({
    where: { email: 'bahram.ma@gmail.com' },
    update: { name: 'bahram' },
    create: {
      email: 'bahram.ma@gmail.com',
      name: 'Bahram',
      is_admin: false,
      email_confirmed: true,
      credentials: {
        create: {
          hash: '$2b$10$K0PpFbLMbqLqlWvU3gTQ6u0J7ix/ICmk8tduXhd7e/rCbemRe2ZJa', // Bahram12345678
        },
      },
    },
  });
  console.log({ peyman, bahram });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
