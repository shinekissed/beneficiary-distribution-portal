export interface Schedule {
  id: number
  barangay: string
  date: string
  day: string
  time: string
  venue: string
  group: string
  aidType?: string
  notes?: string
  aidType?: string
  notes?: string
}

export interface BeneficiaryLookupRequest {
  name: string
  referenceCode: string
}

export interface BeneficiaryLookupResponse {
  id: number
  name: string
  referenceCode: string
  barangay: string
  scheduleId: number
}

export type BeneficiaryLookupResult = BeneficiaryLookupResponse | null

export interface Announcement {
  id: number
  type: string
  date: string
  title: string
  text: string
}
