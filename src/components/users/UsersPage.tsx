import { useState, useEffect } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Search, X, RefreshCw, Users, Shield, Wrench, Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getAllUsers, type User } from '@/lib/users'
import CreateTechnicianDialog from '@/components/CreateTechnicianDialog'

export function UsersPage() {
    const { toast } = useToast()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

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

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'superadmin': return <Star className="h-4 w-4 text-yellow-500" />
            case 'admin': return <Shield className="h-4 w-4 text-blue-500" />
            case 'technician': return <Wrench className="h-4 w-4 text-green-500" />
            default: return null
        }
    }

    const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (role) {
            case 'superadmin': return 'destructive'
            case 'admin': return 'default'
            case 'technician': return 'secondary'
            default: return 'outline'
        }
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

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

    const groupedUsers = {
        superAdmins: filteredUsers.filter(u => u.role === 'superadmin'),
        admins: filteredUsers.filter(u => u.role === 'admin'),
        technicians: filteredUsers.filter(u => u.role === 'technician'),
        others: filteredUsers.filter(u => !['superadmin', 'admin', 'technician'].includes(u.role))
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <CardTitle>System Users</CardTitle>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchUsers}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <CreateTechnicianDialog onSuccess={fetchUsers} />
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2 flex-1 max-w-sm">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
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
                    </div>

                    {/* Stats */}
                    {!loading && users.length > 0 && (
                        <div className="flex gap-2 text-sm">
                            <Badge variant="outline">Total: {users.length}</Badge>
                            <Badge variant="outline">Super Admins: {groupedUsers.superAdmins.length}</Badge>
                            <Badge variant="outline">Admins: {groupedUsers.admins.length}</Badge>
                            <Badge variant="outline">Technicians: {groupedUsers.technicians.length}</Badge>
                        </div>
                    )}

                    {/* Table */}
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredUsers.length > 0 ? (
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
                                    {Object.entries(groupedUsers).map(([group, users]) =>
                                        users.map(user => (
                                            <TableRow key={user.user_id} className="hover:bg-muted/50">
                                                <TableCell>
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className={
                                                            group === 'superAdmins' ? 'bg-red-100 text-red-600' :
                                                                group === 'admins' ? 'bg-blue-100 text-blue-600' :
                                                                    group === 'technicians' ? 'bg-green-100 text-green-600' : ''
                                                        }>
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
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            No users found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}