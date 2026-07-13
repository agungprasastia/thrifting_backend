import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';

export interface CreateOrderDto {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productIds: string[];
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    if (!dto.productIds || dto.productIds.length === 0) {
      throw new BadRequestException(
        'Order harus memiliki minimal satu produk.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      for (const productId of dto.productIds) {
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new BadRequestException(
            `Produk dengan ID ${productId} tidak ditemukan.`,
          );
        }

        if (product.status === ProductStatus.SOLD_OUT) {
          throw new BadRequestException(
            `Produk "${product.name}" sudah terjual (Sold Out).`,
          );
        }

        // Update product status to SOLD_OUT to prevent double purchase
        await tx.product.update({
          where: { id: productId },
          data: { status: ProductStatus.SOLD_OUT },
        });

        totalAmount += product.price;

        orderItemsData.push({
          productId: product.id,
          price: product.price,
        });
      }

      // Create Order and OrderItems in database
      const order = await tx.order.create({
        data: {
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerAddress: dto.customerAddress,
          totalAmount,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      return order;
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestException(`Order dengan ID ${id} tidak ditemukan.`);
    }

    return order;
  }
}
