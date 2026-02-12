/**
 * Treatment Entity
 * Domain model for clinic treatments/services
 */

export interface DoshaBenefit {
  balances?: boolean;
  aggravates?: boolean;
  notes?: string;
}

export interface DoshaBenefits {
  vata?: DoshaBenefit;
  pitta?: DoshaBenefit;
  kapha?: DoshaBenefit;
}

export interface Treatment {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  basePrice: number | null;
  price: number | null;
  doshaBenefits: DoshaBenefits | null;
  contraindications: string | null;
  metadata: Record<string, any> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transform DTO to entity
 */
export const toTreatmentEntity = (dto: {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  base_price: string | null;
  price: string | null;
  dosha_benefits: DoshaBenefits | null;
  contraindications: string | null;
  metadata_: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}): Treatment => ({
  id: dto.id,
  tenantId: dto.tenant_id,
  code: dto.code,
  name: dto.name,
  description: dto.description,
  durationMinutes: dto.duration_minutes,
  basePrice: dto.base_price ? parseFloat(dto.base_price) : null,
  price: dto.price ? parseFloat(dto.price) : null,
  doshaBenefits: dto.dosha_benefits,
  contraindications: dto.contraindications,
  metadata: dto.metadata_,
  isActive: dto.is_active,
  createdAt: new Date(dto.created_at),
  updatedAt: new Date(dto.updated_at),
});

/**
 * Get effective price (price or base_price)
 */
export const getEffectivePrice = (treatment: Treatment): number | null => {
  return treatment.price ?? treatment.basePrice;
};

/**
 * Get dosha effects summary
 */
export const getDoshaEffects = (treatment: Treatment): {
  balances: string[];
  aggravates: string[];
} => {
  const balances: string[] = [];
  const aggravates: string[] = [];
  
  if (!treatment.doshaBenefits) return { balances, aggravates };
  
  const doshas: (keyof DoshaBenefits)[] = ['vata', 'pitta', 'kapha'];
  
  for (const dosha of doshas) {
    const benefit = treatment.doshaBenefits[dosha];
    if (benefit?.balances) balances.push(dosha.charAt(0).toUpperCase() + dosha.slice(1));
    if (benefit?.aggravates) aggravates.push(dosha.charAt(0).toUpperCase() + dosha.slice(1));
  }
  
  return { balances, aggravates };
};
