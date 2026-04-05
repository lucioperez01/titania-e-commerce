import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config()
test("prisma works", async () => {
    console.log(process.cwd())
    console.log("DATABASE_URL:", process.env.DATABASE_URL)

    const prisma = new PrismaClient()

    const result = await prisma.$queryRaw`SELECT 1`

    expect(result).toBeDefined()

    await prisma.$disconnect()
})