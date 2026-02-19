import { apiGet } from './api'

export type User = {
    user_id: string        // This is the username for assignment
    name: string
    email: string
    phone: string
    role: 'superadmin' | 'technician' | 'admin' // Add other roles as needed
    created_at: string
    updated_at: string
    is_active: boolean
}

export type UsersResponse = {
    status: string
    message: string
    data: User[]
}

export async function getAllUsers() {
    try {
        const response = await apiGet<UsersResponse>('/get_all_users')
        console.log('📦 Users API Response:', response)
        return response
    } catch (error) {
        console.error('❌ Error fetching users:', error)
        throw error
    }
}

// Helper to get only active technicians (optional)
export const getActiveTechnicians = (users: User[]) => {
    return users.filter(user => user.is_active && user.role === 'technician')
}

// Helper to get all active users
export const getActiveUsers = (users: User[]) => {
    return users.filter(user => user.is_active)
}