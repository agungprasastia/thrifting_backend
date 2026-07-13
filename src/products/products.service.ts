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
    const { category, ...productData } = dto;
    return this.prisma.product.create({
      data: {
        ...productData,
        status: ProductStatus.AVAILABLE,
        category: {
          connectOrCreate: {
            where: { name: category },
            create: {
              name: category,
              slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            },
          },
        },
      },
    });
  }

  async findAll(status?: ProductStatus) {
    const where = status ? { status } : {};
    return this.prisma.product.findMany({ where });
  }

  async findLatest() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async findPopular() {
    // In a real app, this might be based on views or sales
    // For now, return random or just a fixed number
    return this.prisma.product.findMany({
      take: 8,
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

    const { category, ...productData } = dto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(category && {
          category: {
            connectOrCreate: {
              where: { name: category },
              create: {
                name: category,
                slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              },
            },
          },
        }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Throws NotFoundException if not found

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
