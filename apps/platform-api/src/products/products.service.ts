import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@supseal/database";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  list(brandId: string) {
    return this.prisma.withBrandContext(brandId, (tx) =>
      tx.product.findMany({ where: { brandId }, orderBy: { createdAt: "desc" } }),
    );
  }

  async getOne(brandId: string, id: string) {
    return this.prisma.withBrandContext(brandId, async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product || product.brandId !== brandId) throw new NotFoundException("Product not found");
      return product;
    });
  }

  async create(brandId: string, dto: CreateProductDto) {
    try {
      return await this.prisma.withBrandContext(brandId, (tx) =>
        tx.product.create({ data: { ...dto, brandId } }),
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("A product with this SKU already exists for your brand");
      }
      throw err;
    }
  }

  async update(brandId: string, id: string, dto: UpdateProductDto) {
    await this.getOne(brandId, id); // 404s if missing or not owned by this brand
    try {
      return await this.prisma.withBrandContext(brandId, (tx) =>
        tx.product.update({ where: { id }, data: dto }),
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("A product with this SKU already exists for your brand");
      }
      throw err;
    }
  }
}
