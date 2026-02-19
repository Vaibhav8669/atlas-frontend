import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from './components/ui/toaster'
import { ThemeProvider } from '@/components/common/theme-provider'
import { ProtectedRoute } from '@/components/common/protected-route'
import { useAuthStore } from './stores/auth-store'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

// Lazy load pages for better performance
// const Dashboard = lazy(() => import('@/pages/Dashboard'))

export default function App() {
    const { checkAuth, isLoading } = useAuthStore()

    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading application...</p>
                </div>
            </div>
        )
    }

    return (
        <ThemeProvider defaultTheme="light" storageKey="app-theme">
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute requireAuth={false}>
                                <Login />
                            </ProtectedRoute>
                        }
                    />

                    {/* Protected Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute requireAuth={true}>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* 404 Route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
            <Toaster />
        </ThemeProvider>
    )
}