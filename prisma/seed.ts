import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@idx.com" },
    update: {},
    create: {
      email: "admin@idx.com",
      name: "Admin",
      passwordHash: "",
      salt: "",
    },
  })
  console.log("Seeded admin user:", admin.email)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
