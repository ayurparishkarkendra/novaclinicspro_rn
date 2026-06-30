export type ClinicalDocumentType = 'Prescription' | 'Case Sheet' | 'Treatment Sheet';

export interface ClinicalPrintParty {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  age?: number | string | null;
  gender?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  registrationNo?: string | null;
}

export interface ClinicalPrintClinic {
  name?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  address?: string | Record<string, unknown> | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  legalText?: string | null;
  registrationNo?: string | null;
}

export interface ClinicalPrintTable {
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
}

export interface ClinicalPrintSection {
  title: string;
  body?: string | null;
  table?: ClinicalPrintTable;
}

export interface ClinicalPrintDocument {
  type: ClinicalDocumentType;
  title: string;
  clinic: ClinicalPrintClinic;
  doctor: ClinicalPrintParty;
  client: ClinicalPrintParty;
  documentDate?: string | null;
  status?: string | null;
  sections: ClinicalPrintSection[];
}
