import type { ServiceSeed, ServiceCategory } from '@/types'

/**
 * Seed data used to populate the `services` table on first run.
 * Do NOT remove entries once they have checks in the DB — mark them inactive instead.
 */
export const SERVICE_SEEDS: ServiceSeed[] = [
  // ── National Government Services ───────────────────────────────────────────
  { name: 'eCitizen Portal', url: 'https://www.ecitizen.go.ke', category: 'national' },
  { name: 'eCitizen Login', url: 'https://accounts.ecitizen.go.ke', category: 'national' },
  { name: 'iTax (KRA)', url: 'https://itax.kra.go.ke', category: 'national' },
  { name: 'Ardhisasa (Lands)', url: 'https://ardhisasa.go.ke', category: 'national' },
  { name: 'NTSA TIMS', url: 'https://www.ntsa.go.ke', category: 'national' },
  { name: 'PPRA (Procurement)', url: 'https://www.ppra.go.ke', category: 'national' },
  { name: 'IFMIS (Treasury)', url: 'https://www.ifmis.go.ke', category: 'national' },
  { name: 'Huduma Kenya', url: 'https://www.hudumakers.go.ke', category: 'national' },
  { name: 'Business Registration', url: 'https://businessregistration.go.ke', category: 'national' },
  { name: 'Immigration eCitizen', url: 'https://immigration.ecitizen.go.ke', category: 'national' },

  // ── County Government Websites ─────────────────────────────────────────────
  { name: 'Nairobi County', url: 'https://nairobi.go.ke', category: 'county' },
  { name: 'Mombasa County', url: 'https://www.mombasa.go.ke', category: 'county' },
  { name: 'Kisumu County', url: 'https://www.kisumu.go.ke', category: 'county' },
  { name: 'Nakuru County', url: 'https://www.nakuru.go.ke', category: 'county' },
  { name: 'Kiambu County', url: 'https://www.kiambu.go.ke', category: 'county' },
  { name: 'Machakos County', url: 'https://www.machakos.go.ke', category: 'county' },
  { name: 'Meru County', url: 'https://www.meru.go.ke', category: 'county' },
  { name: 'Uasin Gishu County', url: 'https://www.uasingishu.go.ke', category: 'county' },
  { name: 'Kakamega County', url: 'https://www.kakamega.go.ke', category: 'county' },
  { name: 'Nyeri County', url: 'https://www.nyeri.go.ke', category: 'county' },
]

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  national: 'National Government Services',
  county: 'County Government Websites',
}
