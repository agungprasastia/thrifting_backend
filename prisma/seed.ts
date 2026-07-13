import { PrismaClient, Role, ProductStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env configuration
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not defined in the environment.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create default admin user
  const adminEmail = 'admin@thrift.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    console.log(`Created default admin user: ${adminEmail} (password: admin123)`);
  } else {
    console.log(`Admin user ${adminEmail} already exists.`);
  }

  // 2. Create sample products
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    const sampleProducts = [
      {
        name: 'Faded Boxy Zip-up',
        description: 'Vintage faded boxy zip-up hoodie. Very comfortable heavyweight cotton.',
        price: 450000,
        size: 'L (72x56)',
        condition: '9/10',
        status: ProductStatus.AVAILABLE,
        category: 'Hoodie',
        imageUrls: [
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDKUTpSVrE_nKEXJTN2Ob3xL0YSyFk88GJVj6qS7eZESABMn1vgqXhuYt9EExMjwi5qqaCgm0xb_ib4Amw6G5oOiiq6XquFNKnaq8TYzQEvJnYqtntH2_nQlkrdJ6vSx1n6dtENaUSvFNKwg0bYILYyKEcXhL_91DuozIKYWhziQ3a5R-8hdFMB0yR-qIALlogFHU7xKEM7QhbaDKR_c8cBtCyP7zjw1B5YcGcLcLZ6JgYRK1pKomjWcHFwaw1IqDceVSGD-tT9wc8',
        ],
      },
      {
        name: 'Distressed Type III Denim',
        description: 'Distressed vintage denim jacket. High quality vintage denim wash.',
        price: 850000,
        size: 'M (65x52)',
        condition: '8.5/10',
        status: ProductStatus.SOLD_OUT,
        category: 'Denim',
        imageUrls: [
          'https://lh3.googleusercontent.com/aida-public/AB6AXuD9OabOGdLNGpLzY0qsIkqoO7s2H7cpg4hcCOF4g1DdRU2FEbRlxQ5D4bUpA4ROMH5ge4QVhvZlknV7Dl_RYKYvKAcodx13thRfUJ0iucdmXWriZ_m4vTC03uWoPy_orGOZU4qHxUFVCvttqDu2EVPJbsYNqbCYo6S0MZp4pcAX8I2dwW7xYnvzHZW6SEpzhHjTR0igQ-kxOWF7AbhiZSUJrp4ddpMJ4TRuZAAZhHWfU3y95fQMFuGQaopa54LLlNC1xwihiwiCu7I',
        ],
      },
      {
        name: '90s Anime Bootleg Tee',
        description: 'Oversized bootleg anime graphic tee. Boxy vintage fit and feel.',
        price: 350000,
        size: 'XL (76x60)',
        condition: '9.5/10',
        status: ProductStatus.AVAILABLE,
        category: 'T-Shirt',
        imageUrls: [
          'https://lh3.googleusercontent.com/aida-public/AB6AXuARDS9JdUZiLZUdhKYHrprE9Ce-oGNK8eAiNlTQRxwJAaS-PmEshxJCc7chlRrl9NahqAtPAfEwDaaMo_h_j99t--X5t6198L4hGGYfRMIQh9k_FBRpVZpNHRDdn2octq6cIAh96jTyT04_N1ngiqQYjUKy-CgWD1E4A3YUPMep6hvP9756eea1aDuqYOW8dUsbpoXqHu45WqAyM4ohBt_ytdxLuk98XBAXl_Oa13B9P1wID8d0tXVcUQiIO0oKwyCd_RR5a2frZLA',
        ],
      },
      {
        name: 'Tech Nylon Track Jacket',
        description: 'Water resistant tech nylon track jacket. Perfect for layering and outdoor activities.',
        price: 550000,
        size: 'L (70x58)',
        condition: '9/10',
        status: ProductStatus.AVAILABLE,
        category: 'Outerwear',
        imageUrls: [
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBMyCBue14G8JGTxP6O2szUtEBOulVf8d0RUZB5O3NNLjgc_ndzaFKGCjOtiq_wfppaF8iiBjQ_-XlD6bm3cb_QLLDDyA2Bqac5KHQ-af6SR1m7FWtaiw40F4WakMDuwT-lajx-Psog9yjUDR4zW0ZHNB2o0JC9QCZReoj0ja8OOYs2dzEIq9G4Eh2EykBN93QjOlK795dzEbdS_oEJjTXrqlL4aFiSqfTpzOuoo9vDbu3SXVQUpPkd5JH97CAbi0OXmL1NPE-XGa8',
        ],
      },
    ];

    for (const p of sampleProducts) {
      await prisma.product.create({ data: p });
    }
    console.log('Successfully seeded database with sample products!');
  } else {
    console.log('Products table already has data. Skipping product seed.');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log('Seeding complete.');
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
