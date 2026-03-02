import { PrismaClient } from '@prisma/client';

// Single PrismaClient instance for the entire application
const prisma = new PrismaClient();

export default prisma;

