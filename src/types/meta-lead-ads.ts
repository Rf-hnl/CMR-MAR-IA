// File: LeadModel.ts

export interface MetaLeadAdsModel {
  adName: string;
  adSetId: string;
  adSetName: string;
  campaignId: string;
  campaignName: string;
  companyName: string;
  customDisclaimerResponses: string;
  dateCreated: string; // Considera cambiar a `Date` si lo parseas
  email: string;
  formId: string;
  fullName: string;
  homeListing: string;
  isOrganic: string; // O puedes usar `boolean` si lo parseas
  leadId: string;
  partnerName: string;
  phoneNumber: string;
  platformId: string;
  retailerItemId: string;
  updatedAt: string; // Considera cambiar a `Date` si lo parseas
  vehicle: string;
  visitRequest: string; // Podría ser 'yes' | 'no' si es controlado
}
