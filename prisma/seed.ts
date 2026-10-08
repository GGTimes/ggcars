import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.user.count()
  if (existing > 0) return

  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase()
  const ownerPassword = process.env.OWNER_PASSWORD
  const managerEmail = process.env.MANAGER_EMAIL?.trim().toLowerCase()
  const managerPassword = process.env.MANAGER_PASSWORD

  if (!ownerEmail || !ownerPassword || !managerEmail || !managerPassword) {
    throw new Error(
      'OWNER_EMAIL, OWNER_PASSWORD, MANAGER_EMAIL, and MANAGER_PASSWORD are required to seed',
    )
  }
  if (ownerEmail === managerEmail) {
    throw new Error('Owner and manager emails must be different')
  }

  await prisma.user.create({
    data: {
      name: process.env.OWNER_NAME?.trim() || 'مالک',
      email: ownerEmail,
      passwordHash: await bcrypt.hash(ownerPassword, 12),
      role: 'OWNER',
    },
  })
  await prisma.user.create({
    data: {
      name: process.env.MANAGER_NAME?.trim() || 'مدیر فروش',
      email: managerEmail,
      passwordHash: await bcrypt.hash(managerPassword, 12),
      role: 'MANAGER',
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
