import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuthStore } from '../stores/auth-store'
import { authService, AuthError } from '../features/auth/auth-service'
import { AppLogo } from '../components/common/logo'

// Enhanced schema with better validation
const loginSchema = z.object({
    username: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .trim()
        .toLowerCase(),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const { setUser } = useAuthStore()

    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const from = (location.state as any)?.from?.pathname || '/dashboard'

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
        },
        mode: 'onBlur', // Validate on blur for better UX
    })

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = form

    const onSubmit = async (values: LoginFormValues) => {
        setError(null)
        setIsLoading(true)

        try {
            const result = await authService.login(values)

            if (result.success) {
                try {
                    const { getCurrentUser } = await import('aws-amplify/auth')
                    const user = await getCurrentUser()
                    setUser(user)
                    navigate(from, { replace: true })
                } catch (userError) {
                    console.error('Failed to get user after login:', userError)
                    setError('Login successful but failed to load user data. Please refresh.')
                }
            } else if (result.nextStep) {
                setError(result.message || 'Additional authentication required')
            }
        } catch (err) {
            console.error('Login error:', err)

            if (err instanceof AuthError) {
                setError(err.message)
            } else if (err instanceof TypeError && err.message === 'Failed to fetch') {
                setError('Network error. Please check your internet connection.')
            } else if (err instanceof Error) {
                // Handle specific error cases
                if (err.message.includes('timeout')) {
                    setError('Request timed out. Please try again.')
                } else if (err.message.includes('CORS')) {
                    setError('Server configuration error. Please contact support.')
                } else {
                    setError(err.message)
                }
            } else {
                setError('An unexpected error occurred. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-blue-100 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border shadow-xl">
                <CardHeader className="space-y-1 text-center p-6 sm:p-10">
                    <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Welcome Back
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Sign in to your account to continue
                    </p>
                </CardHeader>

                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                        <div className="space-y-2">
                            <Label htmlFor="username">
                                Email <span className="text-black">*</span>
                            </Label>
                            <Input
                                id="username"
                                type="email"
                                placeholder="user@company.com"
                                autoComplete="email"
                                autoFocus
                                disabled={isLoading}
                                aria-invalid={!!errors.username}
                                {...register('username')}
                            />
                            {errors.username && (
                                <p className="text-sm text-destructive" role="alert">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">
                                    Password <span className="text-destructive">*</span>
                                </Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                disabled={isLoading}
                                aria-invalid={!!errors.password}
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive" role="alert">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-medium"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="border-t bg-muted/40 px-6 py-5 text-xs text-muted-foreground">
                    <div className="w-full text-center space-y-3">
                        <AppLogo className="mx-auto h-8" />
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}