import { PrismaClient } from '@prisma/client'

// Một PrismaClient duy nhất cho cả server (named export để models/middlewares import { prisma })
export const prisma = new PrismaClient()
