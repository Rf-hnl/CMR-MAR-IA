// Billing Quotes Data Model for Scalability
export interface BillingQuoteProduct {
  name: string;
  cantidad: number;
  descuento: number;
  paymentType: 'unico' | 'mensual';
  price: number;
  categoria: string;
  precio_unitario: number;
  precio_total: number;
  subtotal: number;
  descuento_valor: number;
}

export interface BillingQuoteCalculation {
  total_lista: number;
  total_descuento: number;
  pago_unico_total: number;
  pago_mensual_total: number;
  total_impuestos: number;
  total_final: number;
  pago_unico_total_con_impuesto: number;
  pago_mensual_total_con_impuesto: number;
  pago_unico_50_1?: number;
  pago_unico_50_2?: number;
}

export interface BillingQuote {
  id: string;
  
  // Client Information
  clientName: string;
  clientEmail: string;
  businessType?: string;
  
  // Lead Information (if created from lead)
  leadId?: string;
  leadName?: string;
  
  // Organization & User
  organizationId: string;
  userId: string;
  
  // Quote Configuration
  templateType: 'standard' | 'monthly';
  products: BillingQuoteProduct[];
  calculations: BillingQuoteCalculation;
  
  // PandaDoc Integration
  pandaDocId?: string;
  pandaDocUrl?: string;
  pandaDocStatus?: 'draft' | 'sent' | 'viewed' | 'completed' | 'declined';
  
  // Status & Tracking
  status: 'draft' | 'generated' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  expiresAt: Date;
  
  // Metadata
  metadata: {
    version: string;
    source: 'manual' | 'lead' | 'api';
    totalProducts: number;
    hasDiscounts: boolean;
    hasRecurringItems: boolean;
    viewCount: number;
    lastViewedBy?: string;
    lastViewedAt?: Date;
    ipAddress?: string;
    userAgent?: string;
  };
  
  // Additional Data
  notes?: string;
  internalComments?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  
  // Validity & Terms
  validUntil: Date;
  termsAccepted?: boolean;
  termsAcceptedAt?: Date;
  termsAcceptedBy?: string;
  
  // Currency & Localization
  currency: string;
  locale: string;
  taxRate: number;
  
  // Audit Trail
  auditLog?: Array<{
    action: string;
    timestamp: Date;
    userId: string;
    details?: any;
  }>;
}

export interface CreateBillingQuoteRequest {
  clientName: string;
  clientEmail: string;
  businessType?: string;
  leadId?: string;
  templateType: 'standard' | 'monthly';
  products: Array<{
    name: string;
    cantidad: number;
    descuento: number;
    paymentType: 'unico' | 'mensual';
  }>;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  validUntil?: Date;
}

export interface UpdateBillingQuoteRequest {
  quoteId: string;
  status?: BillingQuote['status'];
  pandaDocStatus?: BillingQuote['pandaDocStatus'];
  notes?: string;
  internalComments?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
}

export interface BillingQuoteFilters {
  status?: BillingQuote['status'][];
  templateType?: ('standard' | 'monthly')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  clientName?: string;
  assignedTo?: string;
  tags?: string[];
  priority?: ('low' | 'medium' | 'high')[];
  hasDiscounts?: boolean;
  hasRecurringItems?: boolean;
}

export interface BillingQuoteStats {
  total: number;
  byStatus: Record<BillingQuote['status'], number>;
  byTemplateType: Record<'standard' | 'monthly', number>;
  totalValue: number;
  averageValue: number;
  acceptanceRate: number;
  viewRate: number;
  totalProductsSold: number;
  topProducts: Array<{
    name: string;
    count: number;
    totalValue: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    value: number;
  }>;
}

// Firestore Document Converter
export const billingQuoteConverter = {
  toFirestore: (quote: BillingQuote) => {
    return {
      ...quote,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      sentAt: quote.sentAt || null,
      viewedAt: quote.viewedAt || null,
      acceptedAt: quote.acceptedAt || null,
      rejectedAt: quote.rejectedAt || null,
      expiresAt: quote.expiresAt,
      validUntil: quote.validUntil,
      termsAcceptedAt: quote.termsAcceptedAt || null,
    };
  },
  fromFirestore: (doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      sentAt: data.sentAt?.toDate() || undefined,
      viewedAt: data.viewedAt?.toDate() || undefined,
      acceptedAt: data.acceptedAt?.toDate() || undefined,
      rejectedAt: data.rejectedAt?.toDate() || undefined,
      expiresAt: data.expiresAt?.toDate() || new Date(),
      validUntil: data.validUntil?.toDate() || new Date(),
      termsAcceptedAt: data.termsAcceptedAt?.toDate() || undefined,
    } as BillingQuote;
  }
};