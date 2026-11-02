-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('USUARIO', 'ADMIN');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "papel" "Papel" NOT NULL DEFAULT 'USUARIO';
