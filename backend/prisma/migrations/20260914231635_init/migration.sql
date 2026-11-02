-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('PAPEL', 'PLASTICO', 'VIDRO', 'METAL', 'ORGANICO', 'ELETRONICO');

-- CreateEnum
CREATE TYPE "TipoPonto" AS ENUM ('ECOPONTO', 'PEV', 'COOPERATIVA', 'PARCEIRO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens" (
    "id" TEXT NOT NULL,
    "nomeItem" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "dataPublicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoritos" (
    "id" TEXT NOT NULL,
    "dataFavorito" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_item" (
    "id" TEXT NOT NULL,
    "urlFoto" TEXT NOT NULL,
    "dataUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "fotos_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos_coleta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoPonto" NOT NULL,
    "endereco" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL DEFAULT 'São Paulo',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "horario" TEXT NOT NULL,
    "telefone" TEXT,
    "materiais" "Categoria"[],
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPorId" TEXT,

    CONSTRAINT "pontos_coleta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descartes" (
    "id" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "pontos" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "pontoId" TEXT NOT NULL,

    CONSTRAINT "descartes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "itens_categoria_idx" ON "itens"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "favoritos_usuarioId_itemId_key" ON "favoritos"("usuarioId", "itemId");

-- CreateIndex
CREATE INDEX "pontos_coleta_cidade_idx" ON "pontos_coleta"("cidade");

-- CreateIndex
CREATE INDEX "descartes_usuarioId_data_idx" ON "descartes"("usuarioId", "data");

-- AddForeignKey
ALTER TABLE "itens" ADD CONSTRAINT "itens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "itens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_item" ADD CONSTRAINT "fotos_item_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "itens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pontos_coleta" ADD CONSTRAINT "pontos_coleta_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descartes" ADD CONSTRAINT "descartes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descartes" ADD CONSTRAINT "descartes_pontoId_fkey" FOREIGN KEY ("pontoId") REFERENCES "pontos_coleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
