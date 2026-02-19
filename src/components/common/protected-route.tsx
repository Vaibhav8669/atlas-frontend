import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth-store'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
    children: React.ReactNode
    requireAuth?: boolean
}

export function ProtectedRoute({
                                   children,
                                   requireAuth = true
                               }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuthStore()
    const location = useLocation()

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    // Redirect to login if authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />
    }

    // Redirect to dashboard if user is authenticated but trying to access public routes
    if (!requireAuth && isAuthenticated) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}