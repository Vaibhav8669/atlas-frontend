import { apiPostTechnician } from './api'

export async function createTechnician(payload: {
    name: string
    email: string
    mobile: string
    role: string
}) {
    return apiPostTechnician('/register_service_user', payload)
}