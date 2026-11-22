import { API_CONFIG } from './config'
import { announcements, beneficiaryLookupRecord, schedules } from '../data/mockData'
import type {
  Announcement,
  BeneficiaryLookupRequest,
  BeneficiaryLookupResult,
  Schedule,
} from '../types/api'

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`API request timed out after ${API_CONFIG.TIMEOUT}ms`)
    }

    if (error instanceof Error) {
      throw error
    }

    throw new Error('API request failed')
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getSchedules(barangay?: string): Promise<Schedule[]> {
  if (API_CONFIG.USE_MOCK_DATA) {
    const query = barangay?.trim().toLowerCase()
    return query ? schedules.filter((schedule) => schedule.barangay.toLowerCase().includes(query)) : schedules
  }

  const query = barangay?.trim()
  const path = query ? `/schedules?barangay=${encodeURIComponent(query)}` : '/schedules'
  return requestJson<Schedule[]>(path)
}

export async function lookupBeneficiary(request: BeneficiaryLookupRequest): Promise<BeneficiaryLookupResult> {
  if (API_CONFIG.USE_MOCK_DATA) {
    const nameMatches = request.name.trim().toLowerCase() === beneficiaryLookupRecord.name.toLowerCase()
    const referenceCodeMatches = request.referenceCode.trim().toLowerCase() === beneficiaryLookupRecord.referenceCode.toLowerCase()
    return nameMatches && referenceCodeMatches ? beneficiaryLookupRecord : null
  }

  return requestJson<BeneficiaryLookupResult>('/beneficiaries/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

export async function getAnnouncements(): Promise<Announcement[]> {
  if (API_CONFIG.USE_MOCK_DATA) {
    return announcements
  }

  return requestJson<Announcement[]>('/announcements')
}
