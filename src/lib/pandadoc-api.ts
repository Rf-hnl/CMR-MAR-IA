// PandaDoc API integration - migrated from Python system
import { PRICING_CATALOG } from '@/data/pricing';

// PandaDoc configuration
export const PANDADOC_CONFIG = {
  API_KEY: process.env.PANDADOC_API_KEY || "b312bd6063d6a1b3d6b26a3459e64f3c27c0e39b",
  BASE_URL: "https://api.pandadoc.com/public/v1",
  TEMPLATES: {
    STANDARD: "XRLHeyVBUL2gMGACtdxZin", // Template from generar_cotizacion.py
    MONTHLY: "LYQ6gaCxbd6LUsgA6uskED"    // Template from generar_cotizacion_mensual.py
  },
  PRICING_TABLE_NAME: "antares_table",
  TAX_RATE: 0.07, // 7% tax
} as const;

// Interfaces
export interface ProductQuoteItem {
  name: string;
  cantidad: number;
  descuento: number;
  paymentType: 'unico' | 'mensual'; // Payment type: one-time or monthly
}

export interface QuoteCalculation {
  total_lista: number;
  total_descuento: number;
  pago_unico_total: number;
  pago_mensual_total: number;
  total_impuestos: number;
  total_final: number;
  pago_unico_total_con_impuesto: number;
  pago_mensual_total_con_impuesto: number;
  pago_unico_50_1?: number; // For split payments
  pago_unico_50_2?: number;
}

export interface PandaDocPayload {
  name: string;
  template_uuid: string;
  recipients: Array<{
    email: string;
    first_name: string;
    last_name: string;
  }>;
  fields: Record<string, { value: string | number }>;
  tokens: Array<{ name: string; value: string | number }>;
  pricing_tables: Array<{
    name: string;
    data_merge: boolean;
    options: Record<string, any>;
    sections: Array<{
      title: string;
      default: boolean;
      rows: Array<{
        data: {
          Name: string;
          Description: string;
          Price: number;
          QTY: number;
          Discount: {
            type: string;
            value: number;
          };
          Tax: {
            type: string;
            value: number;
          };
        };
        options: {
          optional: boolean;
          optional_selected: boolean;
          qty_editable: boolean;
        };
        custom_fields: {
          Text: string;
        };
      }>;
    }>;
  }>;
}

export interface QuoteRequest {
  cliente: string;
  correo: string;
  productos: ProductQuoteItem[];
  templateType?: 'standard' | 'monthly';
}

// Calculate quote totals
export function calculateQuoteTotals(productos: ProductQuoteItem[]): QuoteCalculation {
  let total_lista = 0;
  let total_descuento = 0;
  let pago_unico_total = 0;
  let pago_mensual_total = 0;

  for (const producto of productos) {
    const precio_unitario = PRICING_CATALOG[producto.name as keyof typeof PRICING_CATALOG] || 0;
    const cantidad = producto.cantidad;
    const descuento = producto.descuento;
    const tipo_pago = producto.paymentType;

    const subtotal = precio_unitario * cantidad;
    const descuento_valor = (precio_unitario * descuento / 100) * cantidad;
    const precio_final = subtotal - descuento_valor;

    total_lista += subtotal;
    total_descuento += descuento_valor;

    if (tipo_pago === 'unico') {
      pago_unico_total += precio_final;
    } else if (tipo_pago === 'mensual') {
      pago_mensual_total += precio_final;
    }
  }

  const total_impuestos = (pago_unico_total + pago_mensual_total) * PANDADOC_CONFIG.TAX_RATE;
  const total_final = total_lista - total_descuento + total_impuestos;

  const pago_unico_total_con_impuesto = pago_unico_total * (1 + PANDADOC_CONFIG.TAX_RATE);
  const pago_mensual_total_con_impuesto = pago_mensual_total * (1 + PANDADOC_CONFIG.TAX_RATE);

  // For split payments (used in monthly template)
  const pago_unico_50_1 = pago_unico_total_con_impuesto / 2;
  const pago_unico_50_2 = pago_unico_total_con_impuesto / 2;

  return {
    total_lista,
    total_descuento,
    pago_unico_total,
    pago_mensual_total,
    total_impuestos,
    total_final,
    pago_unico_total_con_impuesto,
    pago_mensual_total_con_impuesto,
    pago_unico_50_1,
    pago_unico_50_2,
  };
}

// Generate PandaDoc payload
export function generatePandaDocPayload(request: QuoteRequest): PandaDocPayload {
  const { cliente, correo, productos, templateType = 'standard' } = request;
  const calculations = calculateQuoteTotals(productos);
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  
  // Generate pricing table rows
  const rows = productos.map(producto => {
    const precio_unitario = PRICING_CATALOG[producto.name as keyof typeof PRICING_CATALOG] || 0;
    
    return {
      data: {
        Name: producto.name,
        Description: `Cantidad: ${producto.cantidad}`,
        Price: Number(precio_unitario.toFixed(2)),
        QTY: producto.cantidad,
        Discount: {
          type: "percent",
          value: producto.descuento
        },
        Tax: {
          type: "percent",
          value: 7
        }
      },
      options: {
        optional: false,
        optional_selected: true,
        qty_editable: false
      },
      custom_fields: {
        Text: producto.paymentType === 'unico' ? 'Unico' : 'Mensual'
      }
    };
  });

  // Base tokens (common to both templates)
  const baseTokens = [
    { name: "client", value: cliente },
    { name: "Client.FirstName", value: cliente },
    { name: "cliente.Email", value: correo },
    { name: "Client.City", value: "Panama City" },
    { name: "Sender.FirstName", value: "María" },
    { name: "Sender.LastName", value: "Montes" },
    { name: "Sender.Company", value: "HypernovLabs" },
    { name: "date", value: currentDate.toLocaleDateString('es-ES') },
    { name: "total", value: Number(calculations.total_final.toFixed(2)) },
    { name: "total_lista", value: Number(calculations.total_lista.toFixed(2)) },
    { name: "total_descuento", value: Number(calculations.total_descuento.toFixed(2)) },
    { name: "impuestos", value: Number(calculations.total_impuestos.toFixed(2)) },
    { name: "antares_table.Tax", value: Number(calculations.total_impuestos.toFixed(2)) },
    { name: "Total.Pagounico", value: Number(calculations.pago_unico_total_con_impuesto.toFixed(2)) },
    { name: "Total.Pagomensual", value: Number(calculations.pago_mensual_total_con_impuesto.toFixed(2)) },
    { name: "document_name", value: `Quotation - ${cliente} - ${monthYear}` }
  ];

  // Add split payment tokens if monthly template
  const tokens = templateType === 'monthly' ? [
    ...baseTokens,
    { name: "PagoUnico.50_1", value: Number(calculations.pago_unico_50_1?.toFixed(2) || 0) },
    { name: "PagoUnico.50_2", value: Number(calculations.pago_unico_50_2?.toFixed(2) || 0) }
  ] : baseTokens;

  return {
    name: `Quotation - ${cliente} - ${monthYear}`,
    template_uuid: templateType === 'monthly' 
      ? PANDADOC_CONFIG.TEMPLATES.MONTHLY 
      : PANDADOC_CONFIG.TEMPLATES.STANDARD,
    recipients: [
      {
        email: correo,
        first_name: cliente,
        last_name: "",
      }
    ],
    fields: {
      client_name: { value: cliente },
      date: { value: currentDate.toLocaleDateString('es-ES') },
      total: { value: Number(calculations.total_final.toFixed(2)) },
      total_lista: { value: Number(calculations.total_lista.toFixed(2)) },
      total_descuento: { value: Number(calculations.total_descuento.toFixed(2)) }
    },
    tokens,
    pricing_tables: [
      {
        name: PANDADOC_CONFIG.PRICING_TABLE_NAME,
        data_merge: true,
        options: {},
        sections: [
          {
            title: "Antares Tech - Cotización personalizada",
            default: true,
            rows: rows
          }
        ]
      }
    ]
  };
}

// Send quote to PandaDoc
export async function sendQuoteToPandaDoc(request: QuoteRequest): Promise<{
  success: boolean;
  documentId?: string;
  viewUrl?: string;
  error?: string;
}> {
  try {
    const payload = generatePandaDocPayload(request);
    
    const response = await fetch(`${PANDADOC_CONFIG.BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `API-Key ${PANDADOC_CONFIG.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      const documentId = result.id;
      const viewUrl = `https://app.pandadoc.com/a/#/documents/${documentId}`;
      
      return {
        success: true,
        documentId,
        viewUrl
      };
    } else {
      const errorText = await response.text();
      console.error('PandaDoc API Error:', response.status, errorText);
      
      return {
        success: false,
        error: `Error ${response.status}: ${errorText}`
      };
    }
  } catch (error) {
    console.error('PandaDoc request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Utility function to validate products
export function validateQuoteRequest(request: QuoteRequest): string[] {
  const errors: string[] = [];
  
  if (!request.cliente?.trim()) {
    errors.push('Cliente es requerido');
  }
  
  if (!request.correo?.trim()) {
    errors.push('Correo es requerido');
  } else if (!/\S+@\S+\.\S+/.test(request.correo)) {
    errors.push('Formato de correo inválido');
  }
  
  if (!request.productos || request.productos.length === 0) {
    errors.push('Al menos un producto es requerido');
  } else {
    request.productos.forEach((producto, index) => {
      if (!producto.name?.trim()) {
        errors.push(`Producto ${index + 1}: Nombre es requerido`);
      } else if (!(producto.name in PRICING_CATALOG)) {
        errors.push(`Producto ${index + 1}: "${producto.name}" no existe en el catálogo`);
      }
      
      if (!producto.cantidad || producto.cantidad <= 0) {
        errors.push(`Producto ${index + 1}: Cantidad debe ser mayor a 0`);
      }
      
      if (producto.descuento < 0 || producto.descuento > 100) {
        errors.push(`Producto ${index + 1}: Descuento debe estar entre 0 y 100`);
      }
      
      if (!['unico', 'mensual'].includes(producto.paymentType)) {
        errors.push(`Producto ${index + 1}: Tipo de pago debe ser 'unico' o 'mensual'`);
      }
    });
  }
  
  return errors;
}