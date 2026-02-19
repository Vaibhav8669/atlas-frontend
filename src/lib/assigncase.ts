import { apiPost } from '@/lib/api'

export async function assignCase(caseId: string, assignee: string, scheduledAt?: number) {
    console.log('📤 Assigning case:', { caseId, assignee, scheduledAt })

    try {
        const response = await apiPost('/assign_case', {
            case_id: caseId,
            assignee,
            ...(scheduledAt && { scheduled_at: scheduledAt }),
        })
        console.log('📥 Assign response:', response)
        return response
    } catch (error) {
        console.error('❌ Assign error:', error)
        throw error
    }
}