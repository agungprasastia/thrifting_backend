import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  size: string;
  category: string;
  condition: string;
  imageUrls: string[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  size?: string;
  category?: string;
  condition?: string;
  status?: ProductStatus;
  imageUrls?: string[];
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
        status: ProductStatus.AVAILABLE,
      },
    });
  }

  async findAll(status?: ProductStatus) {
    return this.prisma.product.findMany({
      where: status ? { status } : {},
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id); // Throws NotFoundException if not found

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Throws NotFoundException if not found

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
