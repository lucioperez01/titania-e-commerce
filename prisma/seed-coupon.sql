-- Insertar promoción de ejemplo
INSERT INTO "Promotion" (
  "name",
  "active",
  "isDeleted",
  "type",
  "couponCode",
  "startsAt",
  "endsAt",
  "createdAt"
) VALUES (
  'Descuento 10% de bienvenida',
  true,
  false,
  'COUPON',
  'BIENVENIDA10',
  NOW(),
  NOW() + INTERVAL '30 days',
  NOW()
) RETURNING id;

-- Obtener el ID de la promoción recién creada (asumimos que es 1 para este ejemplo)
-- Si tienes otras promociones, ajusta el ID en los siguientes inserts

-- Insertar condición: mínimo $50,000 de compra
INSERT INTO "PromotionCondition" (
  "promotionId",
  "minSubtotal",
  "isDeleted"
) VALUES (
  1, -- Ajusta este ID según el ID real de tu promoción
  50000.00,
  false
);

-- Insertar beneficio: 10% de descuento
INSERT INTO "PromotionBenefit" (
  "promotionId",
  "discountType",
  "value",
  "isDeleted"
) VALUES (
  1, -- Ajusta este ID según el ID real de tu promoción
  'PERCENTAGE',
  10.00,
  false
);
