// Migrated from quote/precios.json
export const PRICING_CATALOG = {
  // Hardware - TPV Systems
  "Hioscreen Android 21.5\" (pantalla de cocina)": 620.00,
  "TPV Hiopos LITE con impresora integrada (packs 96)": 375.00,
  "Hiopos Mobile": 300.00,
  "TPV Hiopos SUN II pantalla single": 700.00,
  "TPV Hiopos SUN II con doble pantalla": 820.00,
  "TPV Hiopos SUN con impresora integrada - Single": 650.00,
  "TPV Hiopos SUN con impresora integrada - Doble pantalla": 700.00,
  "TPV Hiopos 2 en 1: Tablet + TPV - modelo M278": 950.00,
  "TPV Android Custom pantalla single": 555.00,

  // Hardware - Balanzas y Periféricos
  "Balanza TS10 sólo peso": 250.00,
  "Balanza + TPV + Impresora integrado (modelo TS20)": 1920.00,
  "Impresora blanca Hiopos USB+Serie+Ethernet": 170.00,
  "Impresora negra ICG USB+Serie+Ethernet": 170.00,
  "Impresora comanda Sewoo / Logicontrols USB + Ethernet": 170.00,
  "Cajon portamonedas": 78.00,
  "Scanner negro código de barras Newland USB 2D": 92.00,
  "Scanner negro código de barras Hiopos USB 2D": 92.00,
  "Lector de tarjetas para Hiopos SUN": 55.00,

  // Software - Punto de Venta
  "Hiopos Punto de venta": 60.00,
  "Terminal #2 en adelante": 40.00,
  "Analytics": 45.00,
  "Combo Hiopos + Analytics (2da caja en adelante)": 29.00,
  "Retail Mobile": 25.00,

  // Software - Pedidos y Delivery
  "Hi Order": 25.00,
  "HiScreen / Callscreen": 50.00,
  "Callscreen (estado del pedido, requiere Hioscreen)": 15.00,
  "HioStock": 22.00,
  "Sitting": 13.00,
  "Delivery": 13.00,
  "HioSchedule": 13.00,

  // Integraciones
  "Integración - x impresora": 5.00,
  "TEF Banesco (Conexión a bancos)": 5.00,
  "POS Management": 5.00,

  // Software - Quioscos y Menús
  "T-Quiosk": 40.00,
  "S-Quiosk": 40.00,
  "T-Menú": 25.00,
  "S-Menú": 25.00,
  "Portal Rest": 25.00,
  "Carta Digital QR": 12.00,

  // Software - Servicios Especializados
  "Cita Online (Peluqueria)": 30.00,
  "HioPay": 30.00,
  "Customer Caller": 13.00,

  // Software - HiOffice
  "HiOffice Lite": 35.00,
  "HiOffice Premium": 50.00,
  "Hioffice usuarios adicionales": 35.00,
  "Modulo contable": 40.00,
  "Modulo Bridge": 35.00,
  
  // HiOffice Gold
  "HiOffice Gold": 80.00,
  "Hioffice Gold (1er usuario)": 65.00,
  "Hioffice Gold (usuarios 2 a 10)": 30.00,
  "Hioffice Gold (usuarios 11 a 50)": 20.00,
  "Hioffice Gold (usuarios 51 a 100)": 18.00,
  "Hioffice Gold (mas de 100 usuarios)": 15.00,

  // Bridge Webservice Gold
  "Bridge Webservice Gold hasta 10 establecimientos": 20.00,
  "Bridge Webservice Gold hasta 50 establecimientos": 60.00,
  "Bridge Webservice Gold hasta 200 establecimientos": 80.00,
  "Bridge Webservice Gold hasta 500 establecimientos": 180.00,
  "Bridge Webservice Gold mas de 500 establecimientos": 220.00,

  // Ecommerce
  "Ecommerce Web": 25.00,
  "Ecommerce Lite": 25.00,
  "Ecommerce Lite + carrito": 36.00,
  "Pasarela de pago Ecommerce": 6.00,
  "Dominio Propio Ecommerce": 7.00,
};

// Product categories for better organization
export const PRODUCT_CATEGORIES = {
  HARDWARE_TPV: "Hardware - Sistemas TPV",
  HARDWARE_PERIPHERALS: "Hardware - Periféricos",
  SOFTWARE_POS: "Software - Punto de Venta",
  SOFTWARE_ORDERS: "Software - Pedidos y Delivery",
  SOFTWARE_INTEGRATIONS: "Integraciones",
  SOFTWARE_KIOSKS: "Software - Quioscos y Menús",
  SOFTWARE_SPECIALIZED: "Software - Servicios Especializados",
  SOFTWARE_HIOFFICE: "Software - HiOffice",
  SOFTWARE_ECOMMERCE: "Software - Ecommerce",
} as const;

// Product item interface
export interface ProductItem {
  name: string;
  price: number;
  category: keyof typeof PRODUCT_CATEGORIES;
  isRecurring?: boolean; // true for monthly subscriptions
  description?: string;
}

// Organized product catalog
export const ORGANIZED_CATALOG: Record<string, ProductItem[]> = {
  [PRODUCT_CATEGORIES.HARDWARE_TPV]: [
    {
      name: "Hioscreen Android 21.5\" (pantalla de cocina)",
      price: 620.00,
      category: "HARDWARE_TPV",
      description: "Pantalla de cocina Android de 21.5 pulgadas"
    },
    {
      name: "TPV Hiopos LITE con impresora integrada (packs 96)",
      price: 375.00,
      category: "HARDWARE_TPV",
      description: "Sistema TPV Lite con impresora incluida"
    },
    {
      name: "Hiopos Mobile",
      price: 300.00,
      category: "HARDWARE_TPV",
      description: "Sistema TPV móvil"
    },
    {
      name: "TPV Hiopos SUN II pantalla single",
      price: 700.00,
      category: "HARDWARE_TPV",
      description: "Sistema TPV SUN II con pantalla simple"
    },
    {
      name: "TPV Hiopos SUN II con doble pantalla",
      price: 820.00,
      category: "HARDWARE_TPV",
      description: "Sistema TPV SUN II con doble pantalla"
    },
    {
      name: "TPV Hiopos SUN con impresora integrada - Single",
      price: 650.00,
      category: "HARDWARE_TPV",
      description: "TPV SUN con impresora integrada, pantalla simple"
    },
    {
      name: "TPV Hiopos SUN con impresora integrada - Doble pantalla",
      price: 700.00,
      category: "HARDWARE_TPV",
      description: "TPV SUN con impresora integrada, doble pantalla"
    },
    {
      name: "TPV Hiopos 2 en 1: Tablet + TPV - modelo M278",
      price: 950.00,
      category: "HARDWARE_TPV",
      description: "Sistema híbrido tablet y TPV"
    },
    {
      name: "TPV Android Custom pantalla single",
      price: 555.00,
      category: "HARDWARE_TPV",
      description: "TPV personalizado Android con pantalla simple"
    },
  ],
  
  [PRODUCT_CATEGORIES.HARDWARE_PERIPHERALS]: [
    {
      name: "Balanza TS10 sólo peso",
      price: 250.00,
      category: "HARDWARE_PERIPHERALS",
      description: "Balanza básica para peso únicamente"
    },
    {
      name: "Balanza + TPV + Impresora integrado (modelo TS20)",
      price: 1920.00,
      category: "HARDWARE_PERIPHERALS",
      description: "Sistema integrado completo con balanza, TPV e impresora"
    },
    {
      name: "Impresora blanca Hiopos USB+Serie+Ethernet",
      price: 170.00,
      category: "HARDWARE_PERIPHERALS",
      description: "Impresora de tickets blanca con múltiples conexiones"
    },
    {
      name: "Impresora negra ICG USB+Serie+Ethernet",
      price: 170.00,
      category: "HARDWARE_PERIPHERALS",
      description: "Impresora de tickets negra con múltiples conexiones"
    },
    {
      name: "Impresora comanda Sewoo / Logicontrols USB + Ethernet",
      price: 170.00,
      category: "HARDWARE_PERIPHERALS",
      description: "Impresora para comandas de cocina"
    },
    {
      name: "Cajon portamonedas",
      price: 78.00,
      category: "HARDWARE_PERIPHERALS",
      description: "Cajón para efectivo compatible con TPV"
    },
    {
      name: "Scanner negro código de barras Newland USB 2D",
      price: 92.00,
      category: "HARDWARE_PERIPHERALS",
      description: "Lector de códigos de barras 2D Newland"
    },
    {
      name: "Scanner negro código de barras Hiopos USB 2D",
      price: 92.00,
      category: "HARDWARE_PERIPHERALS",
      description: "Lector de códigos de barras 2D Hiopos"
    },
    {
      name: "Lector de tarjetas para Hiopos SUN",
      price: 55.00,
      category: "HARDWARE_PERIPHERALS",
      description: "Lector de tarjetas compatible con Hiopos SUN"
    },
  ],
  
  [PRODUCT_CATEGORIES.SOFTWARE_POS]: [
    {
      name: "Hiopos Punto de venta",
      price: 60.00,
      category: "SOFTWARE_POS",
      isRecurring: true,
      description: "Software principal de punto de venta"
    },
    {
      name: "Terminal #2 en adelante",
      price: 40.00,
      category: "SOFTWARE_POS",
      isRecurring: true,
      description: "Licencia adicional para terminales extra"
    },
    {
      name: "Analytics",
      price: 45.00,
      category: "SOFTWARE_POS",
      isRecurring: true,
      description: "Módulo de análisis y reportes avanzados"
    },
    {
      name: "Combo Hiopos + Analytics (2da caja en adelante)",
      price: 29.00,
      category: "SOFTWARE_POS",
      isRecurring: true,
      description: "Paquete combinado para cajas adicionales"
    },
    {
      name: "Retail Mobile",
      price: 25.00,
      category: "SOFTWARE_POS",
      isRecurring: true,
      description: "Aplicación móvil para ventas retail"
    },
  ],
  
  [PRODUCT_CATEGORIES.SOFTWARE_ORDERS]: [
    {
      name: "Hi Order",
      price: 25.00,
      category: "SOFTWARE_ORDERS",
      isRecurring: true,
      description: "Sistema de gestión de pedidos"
    },
    {
      name: "HiScreen / Callscreen",
      price: 50.00,
      category: "SOFTWARE_ORDERS",
      isRecurring: true,
      description: "Pantalla de avisos y llamadas"
    },
    {
      name: "Callscreen (estado del pedido, requiere Hioscreen)",
      price: 15.00,
      category: "SOFTWARE_ORDERS",
      isRecurring: true,
      description: "Extensión para estado de pedidos"
    },
    {
      name: "HioStock",
      price: 22.00,
      category: "SOFTWARE_ORDERS",
      isRecurring: true,
      description: "Sistema de gestión de inventario"
    },
    {
      name: "Sitting",
      price: 13.00,
      category: "SOFTWARE_ORDERS",
      isRecurring: true,
      description: "Gestión de mesas y reservas"
    },
    {
      name: "Delivery",
      price: 13.00,
      category: "SOFTWARE_ORDERS",
      isRecurring: true,
      description: "Módulo de delivery y reparto"
    },
    {
      name: "HioSchedule",
      price: 13.00,
      category: "SOFTWARE_ORDERS",
      isRecurring: true,
      description: "Programación de horarios y turnos"
    },
  ],
  
  [PRODUCT_CATEGORIES.SOFTWARE_INTEGRATIONS]: [
    {
      name: "Integración - x impresora",
      price: 5.00,
      category: "SOFTWARE_INTEGRATIONS",
      isRecurring: true,
      description: "Integración por impresora adicional"
    },
    {
      name: "TEF Banesco (Conexión a bancos)",
      price: 5.00,
      category: "SOFTWARE_INTEGRATIONS",
      isRecurring: true,
      description: "Conexión con Terminal de Punto de Venta bancario"
    },
    {
      name: "POS Management",
      price: 5.00,
      category: "SOFTWARE_INTEGRATIONS",
      isRecurring: true,
      description: "Gestión avanzada de punto de venta"
    },
  ],
  
  [PRODUCT_CATEGORIES.SOFTWARE_KIOSKS]: [
    {
      name: "T-Quiosk",
      price: 40.00,
      category: "SOFTWARE_KIOSKS",
      isRecurring: true,
      description: "Quiosco interactivo táctil"
    },
    {
      name: "S-Quiosk",
      price: 40.00,
      category: "SOFTWARE_KIOSKS",
      isRecurring: true,
      description: "Quiosco interactivo simple"
    },
    {
      name: "T-Menú",
      price: 25.00,
      category: "SOFTWARE_KIOSKS",
      isRecurring: true,
      description: "Menú digital táctil"
    },
    {
      name: "S-Menú",
      price: 25.00,
      category: "SOFTWARE_KIOSKS",
      isRecurring: true,
      description: "Menú digital simple"
    },
    {
      name: "Portal Rest",
      price: 25.00,
      category: "SOFTWARE_KIOSKS",
      isRecurring: true,
      description: "Portal web para restaurantes"
    },
    {
      name: "Carta Digital QR",
      price: 12.00,
      category: "SOFTWARE_KIOSKS",
      isRecurring: true,
      description: "Carta digital con código QR"
    },
  ],
  
  [PRODUCT_CATEGORIES.SOFTWARE_SPECIALIZED]: [
    {
      name: "Cita Online (Peluqueria)",
      price: 30.00,
      category: "SOFTWARE_SPECIALIZED",
      isRecurring: true,
      description: "Sistema de citas online para peluquerías"
    },
    {
      name: "HioPay",
      price: 30.00,
      category: "SOFTWARE_SPECIALIZED",
      isRecurring: true,
      description: "Sistema de pagos integrado"
    },
    {
      name: "Customer Caller",
      price: 13.00,
      category: "SOFTWARE_SPECIALIZED",
      isRecurring: true,
      description: "Sistema de llamada a clientes"
    },
  ],
  
  [PRODUCT_CATEGORIES.SOFTWARE_HIOFFICE]: [
    {
      name: "HiOffice Lite",
      price: 35.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Suite de oficina básica"
    },
    {
      name: "HiOffice Premium",
      price: 50.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Suite de oficina premium"
    },
    {
      name: "Hioffice usuarios adicionales",
      price: 35.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Licencias adicionales de usuario"
    },
    {
      name: "Modulo contable",
      price: 40.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Módulo de contabilidad"
    },
    {
      name: "Modulo Bridge",
      price: 35.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Módulo de integración Bridge"
    },
    {
      name: "HiOffice Gold",
      price: 80.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Suite empresarial completa"
    },
    {
      name: "Hioffice Gold (1er usuario)",
      price: 65.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Primer usuario de HiOffice Gold"
    },
    {
      name: "Hioffice Gold (usuarios 2 a 10)",
      price: 30.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Usuarios 2-10 de HiOffice Gold"
    },
    {
      name: "Hioffice Gold (usuarios 11 a 50)",
      price: 20.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Usuarios 11-50 de HiOffice Gold"
    },
    {
      name: "Hioffice Gold (usuarios 51 a 100)",
      price: 18.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Usuarios 51-100 de HiOffice Gold"
    },
    {
      name: "Hioffice Gold (mas de 100 usuarios)",
      price: 15.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Más de 100 usuarios de HiOffice Gold"
    },
    {
      name: "Bridge Webservice Gold hasta 10 establecimientos",
      price: 20.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Bridge para hasta 10 establecimientos"
    },
    {
      name: "Bridge Webservice Gold hasta 50 establecimientos",
      price: 60.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Bridge para hasta 50 establecimientos"
    },
    {
      name: "Bridge Webservice Gold hasta 200 establecimientos",
      price: 80.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Bridge para hasta 200 establecimientos"
    },
    {
      name: "Bridge Webservice Gold hasta 500 establecimientos",
      price: 180.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Bridge para hasta 500 establecimientos"
    },
    {
      name: "Bridge Webservice Gold mas de 500 establecimientos",
      price: 220.00,
      category: "SOFTWARE_HIOFFICE",
      isRecurring: true,
      description: "Bridge para más de 500 establecimientos"
    },
  ],
  
  [PRODUCT_CATEGORIES.SOFTWARE_ECOMMERCE]: [
    {
      name: "Ecommerce Web",
      price: 25.00,
      category: "SOFTWARE_ECOMMERCE",
      isRecurring: true,
      description: "Plataforma de ecommerce web"
    },
    {
      name: "Ecommerce Lite",
      price: 25.00,
      category: "SOFTWARE_ECOMMERCE",
      isRecurring: true,
      description: "Plataforma de ecommerce básica"
    },
    {
      name: "Ecommerce Lite + carrito",
      price: 36.00,
      category: "SOFTWARE_ECOMMERCE",
      isRecurring: true,
      description: "Ecommerce básico con carrito de compras"
    },
    {
      name: "Pasarela de pago Ecommerce",
      price: 6.00,
      category: "SOFTWARE_ECOMMERCE",
      isRecurring: true,
      description: "Integración de pasarela de pagos"
    },
    {
      name: "Dominio Propio Ecommerce",
      price: 7.00,
      category: "SOFTWARE_ECOMMERCE",
      isRecurring: true,
      description: "Dominio personalizado para ecommerce"
    },
  ],
};

// Helper functions
export const getPriceByName = (productName: string): number => {
  return PRICING_CATALOG[productName] || 0;
};

export const getAllProducts = (): ProductItem[] => {
  return Object.values(ORGANIZED_CATALOG).flat();
};

export const getProductsByCategory = (category: keyof typeof PRODUCT_CATEGORIES): ProductItem[] => {
  return ORGANIZED_CATALOG[PRODUCT_CATEGORIES[category]] || [];
};

export const searchProducts = (query: string): ProductItem[] => {
  const allProducts = getAllProducts();
  const searchTerm = query.toLowerCase();
  
  return allProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.description?.toLowerCase().includes(searchTerm) ||
    PRODUCT_CATEGORIES[product.category].toLowerCase().includes(searchTerm)
  );
};