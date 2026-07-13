import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const sampleProduct = {
    id: 'prod-123',
    name: 'Vintage T-Shirt',
    description: 'Good condition vintage t-shirt',
    price: 150000,
    size: 'L',
    category: 'T-Shirt',
    condition: '9/10',
    status: ProductStatus.AVAILABLE,
    imageUrls: ['http://example.com/image.jpg'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'Vintage T-Shirt',
      description: 'Good condition vintage t-shirt',
      price: 150000,
      size: 'L',
      category: 'T-Shirt',
      condition: '9/10',
      imageUrls: ['http://example.com/image.jpg'],
    };

    it('should create a product with default status AVAILABLE', async () => {
      mockPrismaService.product.create.mockResolvedValue(sampleProduct);

      const result = await service.create(createDto);

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          status: ProductStatus.AVAILABLE,
        },
      });
      expect(result).toEqual(sampleProduct);
    });
  });

  describe('findAll', () => {
    it('should return all products when no status filter is provided', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([sampleProduct]);

      const result = await service.findAll();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {},
      });
      expect(result).toEqual([sampleProduct]);
    });

    it('should filter products by status when provided', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([sampleProduct]);

      const result = await service.findAll(ProductStatus.AVAILABLE);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { status: ProductStatus.AVAILABLE },
      });
      expect(result).toEqual([sampleProduct]);
    });
  });

  describe('findOne', () => {
    it('should return a product if found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(sampleProduct);

      const result = await service.findOne('prod-123');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
      });
      expect(result).toEqual(sampleProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('prod-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      price: 130000,
      status: ProductStatus.SOLD_OUT,
    };

    it('should update a product if found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(sampleProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...sampleProduct,
        ...updateDto,
      });

      const result = await service.update('prod-123', updateDto);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
        data: updateDto,
      });
      expect(result.price).toBe(130000);
      expect(result.status).toBe(ProductStatus.SOLD_OUT);
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.update('prod-123', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a product if found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(sampleProduct);
      mockPrismaService.product.delete.mockResolvedValue(sampleProduct);

      const result = await service.remove('prod-123');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
      });
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
      });
      expect(result).toEqual(sampleProduct);
    });

    it('should throw NotFoundException when deleting non-existent product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('prod-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
