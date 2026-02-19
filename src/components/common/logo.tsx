import Logo from '@/assets/logo.svg'

interface LogoProps {
    className?: string
    showText?: boolean
}

export function AppLogo({ className = "h-8" }: LogoProps) {
    return (
        <div className="flex items-center gap-2">
            <img
                src={Logo}
                alt="Company Logo"
                className={className}
            />
        </div>
    )
}