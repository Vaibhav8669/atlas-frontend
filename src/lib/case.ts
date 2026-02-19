import { apiGet } from '@/lib/api'

export async function getCaseById(caseId: string) {
    return apiGet<{ data: any }>(`/get_case/${caseId}`)
}
