import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { ProductStatus, OrderStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  const mockTx = {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
    },
  };

  const mockPrismaService = {
    $transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
  };

  const sampleProduct = {
    id: 'prod-123',
    name: 'Vintage Jacket',
    price: 300000,
    status: ProductStatus.AVAILABLE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOrderDto = {
      customerName: 'Agung',
      customerPhone: '081234567890',
      customerAddress: 'Jl. Merdeka No. 10',
      productIds: ['prod-123'],
    };

    it('should successfully place an order and mark product as SOLD_OUT', async () => {
      mockTx.product.findUnique.mockResolvedValue(sampleProduct);
      mockTx.order.create.mockResolvedValue({
        id: 'order-999',
        ...createOrderDto,
        totalAmount: 300000,
        status: OrderStatus.PENDING,
        orderItems: [
          {
            id: 'item-1',
            productId: 'prod-123',
            price: 300000,
          },
        ],
      });

      const result = await service.create(createOrderDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockTx.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
      });
      expect(mockTx.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
        data: { status: ProductStatus.SOLD_OUT },
      });
      expect(mockTx.order.create).toHaveBeenCalledWith({
        data: {
          customerName: createOrderDto.customerName,
          customerPhone: createOrderDto.customerPhone,
          customerAddress: createOrderDto.customerAddress,
          totalAmount: 300000,
          orderItems: {
            create: [
              {
                productId: 'prod-123',
                price: 300000,
              },
            ],
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

      expect(result.id).toBe('order-999');
      expect(result.totalAmount).toBe(300000);
    });

    it('should throw BadRequestException if product does not exist', async () => {
      mockTx.product.findUnique.mockResolvedValue(null);

      await expect(service.create(createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockTx.order.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if product is already SOLD_OUT', async () => {
      mockTx.product.findUnique.mockResolvedValue({
        ...sampleProduct,
        status: ProductStatus.SOLD_OUT,
      });

      await expect(service.create(createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockTx.order.create).not.toHaveBeenCalled();
    });
  });
});
