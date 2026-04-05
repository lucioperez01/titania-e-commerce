// prisma-test.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const r = await prisma.$queryRaw`SELECT 1`
    console.log(r)
    await prisma.$disconnect()
}

main()