import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppLogo } from './logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, Settings } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2 } from 'lucide-react'

export function Navbar() {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const [showSuccess, setShowSuccess] = useState(false)

    const handleLogout = async () => {
        await logout()
        setShowSuccess(true)
    }

    const handleSuccessClose = () => {
        setShowSuccess(false)
        navigate('/')
    }

    // Get user initials for avatar
    const getInitials = () => {
        if (!user?.username) return 'U'
        return user.username.substring(0, 2).toUpperCase()
    }

    return (
        <>
            <nav className="border-b bg-background">
                <div className="flex h-16 items-center px-4 container mx-auto">
                    <AppLogo showText={true} />
                    <div className="ml-auto flex items-center space-x-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{getInitials()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-bold uppercase leading-none">
                                            {user?.username || 'User'}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate('/profile')}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/settings')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </nav>

            {/* Success Dialog - Same pattern as AssignCaseDialog */}
            <Dialog open={showSuccess} onOpenChange={handleSuccessClose}>
                <DialogContent className="max-w-sm">
                    <DialogHeader className="text-center">
                        <DialogTitle className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                            Logged Out Successfully
                        </DialogTitle>
                    </DialogHeader>

                    <p className="text-center text-sm text-muted-foreground">
                        You have been logged out of your account.
                    </p>

                    <Button className="w-full mt-4" onClick={handleSuccessClose}>
                        Done
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    )
}