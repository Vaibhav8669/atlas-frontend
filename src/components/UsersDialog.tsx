import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Users, Search, X, RefreshCw, Shield, Wrench, Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getAllUsers, type User } from '@/lib/users'

export function UsersDialog() {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Fetch users when dialog opens
    useEffect(() => {
        if (open) {
            fetchUsers()
        }
    }, [open])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const response = await getAllUsers()
            setUsers(response.data)
        } catch (error) {
            console.error('Error fetching users:', error)
            toast({
                title: 'Error',
                description: 'Failed to load users',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    // Get role icon
    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'superadmin':
                return <Star className="h-4 w-4 text-yellow-500" />
            case 'admin':
                return <Shield className="h-4 w-4 text-blue-500" />
            case 'technician':
                return <Wrench className="h-4 w-4 text-green-500" />
            default:
                return null
        }
    }

    // Get role badge variant
    const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (role) {
            case 'superadmin':
                return 'destructive'
            case 'admin':
                return 'default'
            case 'technician':
                return 'secondary'
            default:
                return 'outline'
        }
    }

    // Get user initials for avatar
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    // Filter users based on search
    const filteredUsers = users.filter(user => {
        if (!searchTerm) return true
        const searchLower = searchTerm.toLowerCase()
        return (
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.user_id?.toLowerCase().includes(searchLower) ||
            user.role?.toLowerCase().includes(searchLower) ||
            user.phone?.includes(searchTerm)
        )
    })

    // Group users by role
    const superAdmins = filteredUsers.filter(u => u.role === 'superadmin')
    const admins = filteredUsers.filter(u => u.role === 'admin')
    const technicians = filteredUsers.filter(u => u.role === 'technician')
    const others = filteredUsers.filter(u => !['superadmin', 'admin', 'technician'].includes(u.role))

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    View Users
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>System Users</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Controls */}
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2 flex-1 max-w-sm">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users by name, email, role..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                                {searchTerm && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1.5 h-7 w-7 p-0"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchUsers}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>

                    {/* Stats */}
                    {!loading && users.length > 0 && (
                        <div className="flex gap-2 text-sm">
                            <Badge variant="outline">Total: {users.length}</Badge>
                            <Badge variant="outline">Super Admins: {superAdmins.length}</Badge>
                            <Badge variant="outline">Admins: {admins.length}</Badge>
                            <Badge variant="outline">Technicians: {technicians.length}</Badge>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {/* Users Table */}
                    {!loading && filteredUsers.length > 0 && (
                        <div className="border rounded-lg overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[80px]">Avatar</TableHead>
                                        <TableHead className="min-w-[150px]">Name</TableHead>
                                        <TableHead className="min-w-[200px]">Email</TableHead>
                                        <TableHead className="min-w-[120px]">User ID</TableHead>
                                        <TableHead className="min-w-[120px]">Role</TableHead>
                                        <TableHead className="min-w-[120px]">Phone</TableHead>
                                        <TableHead className="min-w-[100px]">Status</TableHead>
                                        <TableHead className="min-w-[150px]">Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Super Admins Section */}
                                    {superAdmins.map((user) => (
                                        <TableRow key={user.user_id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-red-100 text-red-600">
                                                        {getInitials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell className="font-mono text-xs">{user.user_id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {getRoleIcon(user.role)}
                                                    <Badge variant={getRoleVariant(user.role)}>
                                                        {user.role}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.phone}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* Admins Section */}
                                    {admins.map((user) => (
                                        <TableRow key={user.user_id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                                        {getInitials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell className="font-mono text-xs">{user.user_id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {getRoleIcon(user.role)}
                                                    <Badge variant={getRoleVariant(user.role)}>
                                                        {user.role}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.phone}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* Technicians Section */}
                                    {technicians.map((user) => (
                                        <TableRow key={user.user_id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-green-100 text-green-600">
                                                        {getInitials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell className="font-mono text-xs">{user.user_id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {getRoleIcon(user.role)}
                                                    <Badge variant={getRoleVariant(user.role)}>
                                                        {user.role}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.phone}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* Other Roles */}
                                    {others.map((user) => (
                                        <TableRow key={user.user_id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>
                                                        {getInitials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell className="font-mono text-xs">{user.user_id}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user.role}</Badge>
                                            </TableCell>
                                            <TableCell>{user.phone}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredUsers.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            {users.length === 0
                                ? 'No users found. Click Refresh to load users.'
                                : 'No users match your search criteria.'
                            }
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}