import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Thrifting API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let authToken: string;
  let testProductId: string;

  const testEmail = `admin-${Date.now()}@thrift.com`;
  const testPassword = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Cleanup test data
    if (testProductId) {
      await prisma.orderItem.deleteMany({ where: { productId: testProductId } });
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
    await prisma.user.deleteMany({ where: { email: testEmail } });

    await app.close();
  });

  // 1. Register Admin
  it('/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: testEmail, password: testPassword })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(testEmail);
    expect(response.body.role).toBe('ADMIN');
  });

  // 2. Login Admin
  it('/auth/login (POST) - should return JWT token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    authToken = response.body.access_token;
  });

  // 3. Create product without JWT (should fail 401)
  it('/products (POST) - unauthorized should fail', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Test E2E Jacket',
        description: 'Excellent thrift condition',
        price: 250000,
        size: 'XL',
        category: 'Jacket',
        condition: '9/10',
        imageUrls: ['http://example.com/e2e.jpg'],
      })
      .expect(401);
  });

  // 4. Create product with JWT (should succeed)
  it('/products (POST) - authorized should succeed', async () => {
    const response = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test E2E Jacket',
        description: 'Excellent thrift condition',
        price: 250000,
        size: 'XL',
        category: 'Jacket',
        condition: '9/10',
        imageUrls: ['http://example.com/e2e.jpg'],
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test E2E Jacket');
    expect(response.body.status).toBe('AVAILABLE');
    testProductId = response.body.id;
  });

  // 5. Get Products list (Public)
  it('/products (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/products?status=AVAILABLE')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    const found = response.body.find((p: any) => p.id === testProductId);
    expect(found).toBeDefined();
  });

  // 6. Checkout / Create Order (Public)
  it('/orders (POST) - should place order and mark product SOLD_OUT', async () => {
    const response = await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerName: 'E2E Shopper',
        customerPhone: '0855555555',
        customerAddress: 'Jalan Raya E2E No. 1',
        productIds: [testProductId],
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.totalAmount).toBe(250000);

    // Verify product status is now SOLD_OUT
    const product = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(product?.status).toBe('SOLD_OUT');
  });

  // 7. Double purchase prevention (should fail 400)
  it('/orders (POST) - checkout same product again should fail', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerName: 'Another E2E Shopper',
        customerPhone: '0877777777',
        customerAddress: 'Jalan Raya E2E No. 2',
        productIds: [testProductId],
      })
      .expect(400);
  });
});
