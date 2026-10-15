const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up test coupon...');

  // Check if promotion exists
  let promotion = await prisma.promotion.findFirst({
    where: { couponCode: 'BIENVENIDA10' },
  });

  if (!promotion) {
    // Create promotion
    promotion = await prisma.promotion.create({
      data: {
        name: 'Descuento 10% de bienvenida',
        active: true,
        isDeleted: false,
        type: 'COUPON',
        couponCode: 'BIENVENIDA10',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });
    console.log(`Created promotion: ${promotion.name} (ID: ${promotion.id})`);
  } else {
    console.log(`Promotion already exists (ID: ${promotion.id})`);
  }

  // Check if condition exists
  const existingCondition = await prisma.promotionCondition.findFirst({
    where: { promotionId: promotion.id },
  });

  if (!existingCondition) {
    // Create condition: minimum $50,000 subtotal
    const condition = await prisma.promotionCondition.create({
      data: {
        promotionId: promotion.id,
        minSubtotal: 50000.00,
        isDeleted: false,
      },
    });
    console.log(`Created condition: minimum $50,000 subtotal (ID: ${condition.id})`);
  } else {
    console.log('Condition already exists');
  }

  // Check if benefit exists
  const existingBenefit = await prisma.promotionBenefit.findFirst({
    where: { promotionId: promotion.id },
  });

  if (!existingBenefit) {
    // Create benefit: 10% discount
    const benefit = await prisma.promotionBenefit.create({
      data: {
        promotionId: promotion.id,
        discountType: 'PERCENTAGE',
        value: 10.00,
        isDeleted: false,
      },
    });
    console.log(`Created benefit: 10% discount (ID: ${benefit.id})`);
  } else {
    console.log('Benefit already exists');
  }

  console.log('\nTest coupon setup complete!');
  console.log('Coupon code: BIENVENIDA10');
  console.log('Conditions: Minimum $50,000 subtotal');
  console.log('Benefit: 10% discount');
  console.log('Valid for: 30 days');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
