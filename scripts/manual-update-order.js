// Script para actualizar manualmente el estado de una orden
// Ejecutar: node scripts/manual-update-order.js <order_id>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function manualUpdateOrder(orderId) {
  try {
    console.log(`Actualizando orden #${orderId}...`);

    // 1. Obtener la orden
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { items: true }
    });

    if (!order) {
      console.error('Orden no encontrada');
      process.exit(1);
    }

    console.log(`Estado actual: ${order.status}`);

    if (order.status === 'PAID') {
      console.log('La orden ya está PAID, no hay nada que hacer');
      process.exit(0);
    }

    // 2. Actualizar a PAID
    await prisma.$transaction(async (tx) => {
      // Actualizar orden
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      });

      // Commit stock (decrementar stock y reservedStock)
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity }
            }
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity }
            }
          });
        }
      }

      // Registrar transición
      await tx.orderStatusTransition.create({
        data: {
          orderId: order.id,
          previousStatus: order.status,
          newStatus: 'PAID',
          trigger: 'manual',
          reason: 'Actualización manual vía script'
        }
      });
    });

    console.log('✅ Orden actualizada a PAID');
    console.log('✅ Stock commiteado');
    console.log('✅ Transición registrada');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

const orderId = process.argv[2];
if (!orderId) {
  console.error('Uso: node scripts/manual-update-order.js <order_id>');
  process.exit(1);
}

manualUpdateOrder(orderId);
