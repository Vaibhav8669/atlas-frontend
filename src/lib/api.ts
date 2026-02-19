import { fetchAuthSession } from 'aws-amplify/auth'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://dbpq9qr4nb.execute-api.ap-south-1.amazonaws.com/testing'
const TECHNICIAN_API_BASE = import.meta.env.VITE_TECHNICIAN_API_BASE || 'https://gf8mmdawri.execute-api.ap-south-1.amazonaws.com/dev'

async function getAccessToken() {
    const session = await fetchAuthSession()
    return session.tokens?.accessToken?.toString()
}

export async function apiGet<T>(path: string): Promise<T> {
    const token = await getAccessToken()

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })

    if (!res.ok) {
        throw new Error(`API error ${res.status}`)
    }

    return res.json()
}

export async function apiPost<T>(
    path: string,
    body: unknown
): Promise<T> {
    const token = await getAccessToken()

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `API error ${res.status}`)
    }

    return res.json()
}

// Add technician-specific API function
// Add technician-specific API function
export async function apiPostTechnician<T>(
    path: string,
    body: unknown
): Promise<T> {
    const token = await getAccessToken()

    const res = await fetch(`${TECHNICIAN_API_BASE}${path}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(body),
    })

    const data = await res.json()

    // Check if response contains error even with 200 status
    if (data.errorType || data.errorMessage) {
        throw new Error(data.errorMessage || 'Registration failed')
    }

    if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `API error ${res.status}`)
    }

    return data
}