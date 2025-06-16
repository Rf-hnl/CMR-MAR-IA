// AI to PandaDoc Product Mapping System
import { PRICING_CATALOG, ORGANIZED_CATALOG } from '@/data/pricing';
import type { QuoteData, QuoteItem, QuotePackage } from '@/components/QuoteGeneratorModal';
import type { ProductQuoteItem } from '@/lib/pandadoc-api';

// AI Product to PandaDoc Product Mapping
export const AI_TO_PANDADOC_MAPPING: Record<string, string> = {
  // POS Systems
  "Sistema POS básico": "Hiopos Punto de venta",
  "Sistema POS avanzado": "TPV Hiopos SUN II pantalla single",
  "Sistema POS premium": "TPV Hiopos SUN II con doble pantalla",
  "TPV con impresora": "TPV Hiopos SUN con impresora integrada - Single",
  "TPV doble pantalla": "TPV Hiopos SUN II con doble pantalla",
  "Terminal adicional": "Terminal #2 en adelante",
  
  // Analytics & Reports
  "Analytics": "Analytics",
  "Reportes avanzados": "Analytics",
  "Business Intelligence": "Analytics",
  "Análisis de ventas": "Analytics",
  
  // Mobile Solutions
  "App móvil": "Hiopos Mobile",
  "Solución móvil": "Retail Mobile",
  "POS móvil": "Hiopos Mobile",
  
  // Inventory Management
  "Control de inventario": "HioStock",
  "Gestión de stock": "HioStock",
  "Inventario": "HioStock",
  
  // Hardware
  "Impresora": "Impresora blanca Hiopos USB+Serie+Ethernet",
  "Impresora de tickets": "Impresora blanca Hiopos USB+Serie+Ethernet",
  "Impresora comandas": "Impresora comanda Sewoo / Logicontrols USB + Ethernet",
  "Cajón monedero": "Cajon portamonedas",
  "Lector códigos": "Scanner negro código de barras Newland USB 2D",
  "Balanza": "Balanza TS10 sólo peso",
  
  // Integrations
  "Integración impresora": "Integración - x impresora",
  "Conexión banco": "TEF Banesco (Conexión a bancos)",
  "Gestión POS": "POS Management",
  
  // Restaurant Specific
  "Gestión mesas": "Sitting",
  "Reservas": "Sitting",
  "Delivery": "Delivery",
  "Pedidos online": "Hi Order",
  "Pantalla cocina": "Hioscreen Android 21.5\" (pantalla de cocina)",
  "HiScreen": "HiScreen / Callscreen",
  
  // Digital Solutions
  "Carta digital": "Carta Digital QR",
  "Menú QR": "Carta Digital QR",
  "Quiosco": "T-Quiosk",
  "Menú digital": "T-Menú",
  "Portal web": "Portal Rest",
  
  // Office Solutions
  "Gestión oficina": "HiOffice Lite",
  "Suite oficina": "HiOffice Premium",
  "Contabilidad": "Modulo contable",
  "ERP": "HiOffice Gold",
  "Usuarios adicionales": "Hioffice usuarios adicionales",
  
  // E-commerce
  "Tienda online": "Ecommerce Lite",
  "E-commerce": "Ecommerce Web",
  "Carrito compras": "Ecommerce Lite + carrito",
  "Pagos online": "Pasarela de pago Ecommerce",
  "Dominio web": "Dominio Propio Ecommerce",
  
  // Specialized Services
  "Citas online": "Cita Online (Peluqueria)",
  "Pagos integrados": "HioPay",
  "Llamadas clientes": "Customer Caller",
  "Programación turnos": "HioSchedule",
};

// Business Type to Product Recommendations
export const BUSINESS_TYPE_RECOMMENDATIONS: Record<string, string[]> = {
  "restaurante": [
    "Hiopos Punto de venta",
    "Sitting",
    "Delivery", 
    "Hioscreen Android 21.5\" (pantalla de cocina)",
    "Impresora comanda Sewoo / Logicontrols USB + Ethernet",
    "Carta Digital QR"
  ],
  "retail": [
    "Hiopos Punto de venta",
    "Retail Mobile",
    "HioStock",
    "Scanner negro código de barras Newland USB 2D",
    "Ecommerce Lite"
  ],
  "hotel": [
    "Hiopos Punto de venta", 
    "Sitting",
    "Portal Rest",
    "HiOffice Lite"
  ],
  "peluqueria": [
    "Hiopos Punto de venta",
    "Cita Online (Peluqueria)",
    "HioSchedule"
  ],
  "servicios": [
    "Hiopos Punto de venta",
    "HiOffice Lite",
    "Analytics"
  ]
};

// Priority mapping for AI recommendations
export const AI_PRIORITY_TO_PAYMENT_TYPE: Record<string, 'unico' | 'mensual'> = {
  "alta": "unico",      // High priority = one-time payment
  "media": "mensual",   // Medium priority = monthly payment  
  "baja": "mensual"     // Low priority = monthly payment
};

/**
 * Maps AI-generated quote items to PandaDoc products
 */
export function mapAIQuoteItemToPandaDoc(aiItem: QuoteItem): ProductQuoteItem | null {
  // Try exact name match first
  let pandaDocProductName = AI_TO_PANDADOC_MAPPING[aiItem.nombre];
  
  // If no exact match, try fuzzy matching
  if (!pandaDocProductName) {
    pandaDocProductName = findBestMatch(aiItem.nombre, Object.keys(PRICING_CATALOG));
  }
  
  // If still no match, skip this item
  if (!pandaDocProductName || !(pandaDocProductName in PRICING_CATALOG)) {
    console.warn(`No PandaDoc mapping found for AI product: ${aiItem.nombre}`);
    return null;
  }
  
  return {
    name: pandaDocProductName,
    cantidad: aiItem.cantidad,
    descuento: calculateDiscountFromAI(aiItem),
    paymentType: AI_PRIORITY_TO_PAYMENT_TYPE[aiItem.prioridad] || 'mensual'
  };
}

/**
 * Maps an entire AI quote package to PandaDoc products
 */
export function mapAIPackageToPandaDoc(aiPackage: QuotePackage): ProductQuoteItem[] {
  const mappedProducts: ProductQuoteItem[] = [];
  
  for (const aiItem of aiPackage.items) {
    const mappedProduct = mapAIQuoteItemToPandaDoc(aiItem);
    if (mappedProduct) {
      mappedProducts.push(mappedProduct);
    }
  }
  
  return mappedProducts;
}

/**
 * Maps complete AI quote to PandaDoc format
 */
export function mapAIQuoteToPandaDoc(aiQuote: QuoteData): {
  products: ProductQuoteItem[];
  recommendedPackage: QuotePackage;
  metadata: {
    aiGenerated: boolean;
    originalTitle: string;
    aiAnalysis: any;
    packageCount: number;
    mappingSuccess: number;
  };
} {
  // Use the first (recommended) package
  const recommendedPackage = aiQuote.paquetes_sugeridos[0];
  const mappedProducts = mapAIPackageToPandaDoc(recommendedPackage);
  
  return {
    products: mappedProducts,
    recommendedPackage,
    metadata: {
      aiGenerated: true,
      originalTitle: aiQuote.titulo,
      aiAnalysis: {
        needsAnalysis: aiQuote.analisis_necesidades,
        valueProposition: aiQuote.propuesta_valor,
        nextSteps: aiQuote.proximos_pasos
      },
      packageCount: aiQuote.paquetes_sugeridos.length,
      mappingSuccess: (mappedProducts.length / recommendedPackage.items.length) * 100
    }
  };
}

/**
 * Calculate discount based on AI item data
 */
function calculateDiscountFromAI(aiItem: QuoteItem): number {
  // If AI already suggests a discount in the justification or description
  const discountMatch = aiItem.justificacion.match(/(\d+)%\s*(descuento|discount)/i);
  if (discountMatch) {
    return parseInt(discountMatch[1]);
  }
  
  // Default discount based on priority
  switch (aiItem.prioridad) {
    case 'alta': return 0;   // No discount for high priority
    case 'media': return 5;  // 5% discount for medium priority
    case 'baja': return 10;  // 10% discount for low priority
    default: return 0;
  }
}

/**
 * Fuzzy string matching to find best product match
 */
function findBestMatch(searchTerm: string, productNames: string[]): string | null {
  const normalizedSearch = searchTerm.toLowerCase();
  
  // First try: exact substring match
  for (const productName of productNames) {
    if (productName.toLowerCase().includes(normalizedSearch) || 
        normalizedSearch.includes(productName.toLowerCase())) {
      return productName;
    }
  }
  
  // Second try: keyword matching
  const searchKeywords = normalizedSearch.split(' ');
  let bestMatch = null;
  let highestScore = 0;
  
  for (const productName of productNames) {
    const productKeywords = productName.toLowerCase().split(' ');
    let score = 0;
    
    for (const searchKeyword of searchKeywords) {
      for (const productKeyword of productKeywords) {
        if (productKeyword.includes(searchKeyword) || searchKeyword.includes(productKeyword)) {
          score++;
        }
      }
    }
    
    if (score > highestScore && score > 0) {
      highestScore = score;
      bestMatch = productName;
    }
  }
  
  return bestMatch;
}

/**
 * Get recommended products for business type
 */
export function getRecommendedProductsForBusiness(businessType: string): string[] {
  const normalizedType = businessType.toLowerCase();
  
  // Try exact match first
  if (BUSINESS_TYPE_RECOMMENDATIONS[normalizedType]) {
    return BUSINESS_TYPE_RECOMMENDATIONS[normalizedType];
  }
  
  // Try partial matches
  for (const [type, products] of Object.entries(BUSINESS_TYPE_RECOMMENDATIONS)) {
    if (normalizedType.includes(type) || type.includes(normalizedType)) {
      return products;
    }
  }
  
  // Default fallback
  return BUSINESS_TYPE_RECOMMENDATIONS["servicios"];
}

/**
 * Enhance AI quote with business-specific recommendations
 */
export function enhanceQuoteWithBusinessLogic(
  aiQuote: QuoteData, 
  businessType: string
): QuoteData {
  const recommendedProducts = getRecommendedProductsForBusiness(businessType);
  
  // Add business-specific items to the recommended package if missing
  const enhancedPackage = { ...aiQuote.paquetes_sugeridos[0] };
  
  for (const productName of recommendedProducts.slice(0, 3)) { // Max 3 additional items
    const existsInPackage = enhancedPackage.items.some(item => 
      AI_TO_PANDADOC_MAPPING[item.nombre] === productName ||
      item.nombre.toLowerCase().includes(productName.toLowerCase())
    );
    
    if (!existsInPackage && productName in PRICING_CATALOG) {
      const price = PRICING_CATALOG[productName as keyof typeof PRICING_CATALOG];
      enhancedPackage.items.push({
        nombre: productName,
        categoria: 'producto',
        descripcion: `Recomendado para ${businessType}`,
        cantidad: 1,
        precio_unitario: price,
        precio_total: price,
        justificacion: `Producto esencial para negocios tipo ${businessType}`,
        prioridad: 'media'
      });
    }
  }
  
  // Recalculate package price
  enhancedPackage.precio_paquete = enhancedPackage.items.reduce(
    (sum, item) => sum + item.precio_total, 0
  );
  
  return {
    ...aiQuote,
    paquetes_sugeridos: [enhancedPackage, ...aiQuote.paquetes_sugeridos.slice(1)]
  };
}

/**
 * Validate mapping coverage
 */
export function validateMappingCoverage(aiQuote: QuoteData): {
  totalItems: number;
  mappedItems: number;
  unmappedItems: string[];
  coveragePercentage: number;
} {
  const allItems = aiQuote.paquetes_sugeridos.flatMap(pkg => pkg.items);
  const unmappedItems: string[] = [];
  let mappedCount = 0;
  
  for (const item of allItems) {
    const mapped = mapAIQuoteItemToPandaDoc(item);
    if (mapped) {
      mappedCount++;
    } else {
      unmappedItems.push(item.nombre);
    }
  }
  
  return {
    totalItems: allItems.length,
    mappedItems: mappedCount,
    unmappedItems,
    coveragePercentage: (mappedCount / allItems.length) * 100
  };
}