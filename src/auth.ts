import { signIn } from 'aws-amplify/auth'

export async function login(username: string, password: string) {
    console.group('🔐 Amplify signIn debug')

    console.log('Input username:', username)
    console.log('Username length:', username.length)
    console.log('Password length:', password.length)
    console.log('Password empty:', password.length === 0)

    try {
        console.log('Calling signIn()...')

        const response = await signIn({
            username,
            password,
        })

        console.log(response)

        console.log('signIn response:', response)
        console.log('isSignedIn:', response.isSignedIn)
        console.log('nextStep:', response.nextStep)

        console.groupEnd()
        return response
    } catch (err: any) {
        console.error('❌ signIn error object:', err)
        console.error('❌ error.name:', err?.name)
        console.error('❌ error.message:', err?.message)
        console.error('❌ error.code:', err?.code)
        console.error('❌ error.stack:', err?.stack)

        console.groupEnd()
        throw err
    }
}
