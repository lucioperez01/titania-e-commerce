export const FREE_SHIPPING_THRESHOLD = 100000;

export const SHIPPING_ZONES = {
  zona1: {
    name: 'Zona 1 - Cerca',
    provincias: ['Entre Ríos', 'Santa Fe', 'Córdoba', 'Buenos Aires', 'CABA'],
    precio: 17000
  },
  zona2: {
    name: 'Zona 2 - Media',
    provincias: ['La Pampa', 'San Luis', 'Mendoza', 'San Juan', 'La Rioja', 'Catamarca', 'Santiago del Estero', 'Tucumán', 'Salta', 'Jujuy'],
    precio: 35000
  },
  zona3: {
    name: 'Zona 3 - Lejos',
    provincias: ['Chaco', 'Formosa', 'Misiones', 'Corrientes', 'Neuquén', 'Río Negro', 'Chubut', 'Santa Cruz', 'Tierra del Fuego'],
    precio: 50000
  }
};

export function calculateShippingCost(province: string, subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  
  for (const zone of Object.values(SHIPPING_ZONES)) {
    if (zone.provincias.includes(province)) {
      return zone.precio;
    }
  }
  
  return 50000;
}

export function getZoneByProvince(province: string) {
  for (const [key, zone] of Object.entries(SHIPPING_ZONES)) {
    if (zone.provincias.includes(province)) {
      return { key, ...zone };
    }
  }
  return null;
}
