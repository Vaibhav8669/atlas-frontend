// @ts-ignore
import { signIn, signUp, confirmSignUp, resendSignUpCode, resetPassword, confirmResetPassword, type SignInInput } from 'aws-amplify/auth'

export interface LoginCredentials {
    username: string
    password: string
}

export interface SignUpCredentials {
    email: string
    password: string
    name?: string
}

export class AuthError extends Error {
    // @ts-ignore
    constructor(message: string, public code?: string) {
        super(message)
        this.name = 'AuthError'
    }
}

export const authService = {
    async login(credentials: LoginCredentials) {
        try {
            // Add client-side validation
            if (!credentials.username || !credentials.password) {
                throw new AuthError('Please enter both email and password')
            }

            if (credentials.password.length < 8) {
                throw new AuthError('Password must be at least 8 characters')
            }

            const { username, password } = credentials
            const result = await signIn({ username, password })

            if (result.isSignedIn) {
                return { success: true, data: result }
            }

            return {
                success: false,
                nextStep: result.nextStep,
                message: 'Additional authentication required'
            }
        } catch (error: any) {
            console.error('Login error:', error)

            let message = 'Login failed. Please try again.'
            let code = error.name

            // If it's already our AuthError, use its message
            if (error instanceof AuthError) {
                message = error.message
                code = error.code || error.name
            } else {
                switch (error.name) {
                    case 'UserNotFoundException':
                    case 'NotAuthorizedException':
                        message = 'Invalid email or password'
                        break
                    case 'UserNotConfirmedException':
                        message = 'Please verify your email before logging in'
                        break
                    case 'PasswordResetRequiredException':
                        message = 'Please reset your password'
                        break
                    case 'TooManyRequestsException':
                        message = 'Too many attempts. Please try again later'
                        break
                    case 'LimitExceededException':
                        message = 'Attempt limit exceeded. Please try again later'
                        break
                }
            }

            throw new AuthError(message, code)
        }
    },

    async signUp(credentials: SignUpCredentials) {
        try {
            const { email, password, name } = credentials
            const result = await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                        ...(name && { name }),
                    },
                    autoSignIn: true
                }
            })

            return result
        } catch (error: any) {
            console.error('Signup error:', error)

            let message = 'Signup failed. Please try again.'

            switch (error.name) {
                case 'UsernameExistsException':
                    message = 'An account with this email already exists'
                    break
                case 'InvalidPasswordException':
                    message = 'Password does not meet requirements'
                    break
                case 'InvalidParameterException':
                    message = error.message || 'Invalid input provided'
                    break
            }

            throw new AuthError(message, error.name)
        }
    },

    async confirmSignUp(username: string, confirmationCode: string) {
        try {
            const result = await confirmSignUp({ username, confirmationCode })
            return result
        } catch (error: any) {
            throw new AuthError(
                error.message || 'Failed to confirm signup',
                error.name
            )
        }
    },

    async resendConfirmationCode(username: string) {
        try {
            await resendSignUpCode({ username })
        } catch (error: any) {
            throw new AuthError(
                error.message || 'Failed to resend code',
                error.name
            )
        }
    },

    async resetPassword(username: string) {
        try {
            const result = await resetPassword({ username })
            return result
        } catch (error: any) {
            throw new AuthError(
                error.message || 'Failed to reset password',
                error.name
            )
        }
    },

    async confirmResetPassword(username: string, confirmationCode: string, newPassword: string) {
        try {
            await confirmResetPassword({ username, confirmationCode, newPassword })
        } catch (error: any) {
            throw new AuthError(
                error.message || 'Failed to confirm password reset',
                error.name
            )
        }
    }
}