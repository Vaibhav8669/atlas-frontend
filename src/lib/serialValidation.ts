export async function validateSerialNumber(serial: string, timestamp?: number) {
    try {
        const { fetchAuthSession } = await import('aws-amplify/auth')
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()

        const url = timestamp
            ? `/serial-api/${serial}?t=${timestamp}`
            : `/serial-api/${serial}`

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                Pragma: 'no-cache',
            },
        })

        const data = await res.json()

        // Check if response contains error
        if (data.error || data.message?.toLowerCase().includes('not found')) {
            return {
                valid: false,
                message: data.error?.message || data.message || 'Serial number not found',
                status: res.status
            }
        }

        if (!res.ok) {
            let errorMessage = 'Invalid serial number'

            if (res.status === 401) {
                errorMessage = 'Authentication failed. Please log in again.'
            } else if (res.status === 403) {
                errorMessage = 'You do not have permission to validate serial numbers.'
            } else if (res.status === 404) {
                errorMessage = 'Serial number not found.'
            } else if (res.status === 429) {
                errorMessage = 'Too many requests. Please try again later.'
            } else if (res.status >= 500) {
                errorMessage = 'Server error. Please try again later.'
            }

            return {
                valid: false,
                message: errorMessage,
                status: res.status
            }
        }

        // Success case - data exists and no error
        return {
            valid: true,
            data,
            message: 'Serial number verified',
        }
    } catch (error) {
        console.error('Serial validation error:', error)

        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            return {
                valid: false,
                message: 'Network error. Please check your connection.',
            }
        }

        return {
            valid: false,
            message: error instanceof Error ? error.message : 'Validation failed. Please try again.',
        }
    }
}