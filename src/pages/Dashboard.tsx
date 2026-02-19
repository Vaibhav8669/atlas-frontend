import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import CreateCaseDialog from '../components/CreateCaseDialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { UsersDialog } from '@/components/UsersDialog'
import { SdrDumpDialog } from '../components/SdrDumpDialog'
import { Navbar } from '../components/common/navbar'
import AssignCaseDialog from '@/components/AssignCaseDialog'
import CreateTechnicianDialog from '@/components/CreateTechnicianDialog'
import ViewCaseDialog from '@/components/ViewCaseDialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

type Ticket = {
    ticket_id: string
    status: string
    issue_type: string
    description: string
    serial_number: string
    purchase_date: string
    product_type: string
    product_subtype: string
    warranty_status: string | null
}

type CaseItem = {
    case_id: string
    created_at: string
    updated_at: string
    source: string
    request_type: string
    customer_name: string
    customer_email: string
    customer_mobile: string
    customer_type: string
    pin_code: number
    city: string
    state: string
    street1: string
    street2: string
    status: string
    sub_status: string
    assignee: string
    sla_time: string
    scheduled_at: string
    tickets_data: Ticket[]
}

// Query key for cases
const casesKeys = {
    all: ['cases'] as const,
}

const canAssignCase = (caseItem: CaseItem): boolean => {
    // Can't assign if already assigned (not UNKNOWN)
    if (caseItem.assignee !== 'UNKNOWN') return false
    // Can't assign if case is closed
    if (caseItem.status.toLowerCase() === 'closed') return false
    // Can assign otherwise
    return true
}

// Add this function to calculate case status based on tickets
const getCaseDisplayStatus = (caseItem: CaseItem): string => {
    const tickets = caseItem.tickets_data
    const openTickets = tickets.filter(t => t.status === 'OPEN').length
    const closedTickets = tickets.filter(t => t.status === 'CLOSED').length

    if (closedTickets === tickets.length) return 'CLOSED'
    if (openTickets > 0 && closedTickets > 0) return 'PARTIAL'
    return caseItem.status
}

export default function Dashboard() {
    const { toast } = useToast()
    const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null)

    // Use React Query for data fetching
    const {
        data: cases,
        isLoading,
        error,
        refetch,
        isRefetching
    } = useQuery({
        queryKey: casesKeys.all,
        queryFn: async () => {
            const response = await apiGet<{
                status: string
                message: string
                data: CaseItem[]
            }>('/get_all_cases')

            // Sort by created_at descending (newest first)
            return response.data.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    })

    // Refresh function without page reload
    const handleRefresh = () => {
        refetch()
    }

    // Handle successful operations without reloading
    const handleCaseCreated = () => {
        refetch()
    }

    const handleCaseAssigned = (updatedData?: any) => {
        refetch()

        // If this case is currently open in ViewDialog, update it
        if (selectedCase && updatedData?.case_id === selectedCase.case_id) {
            setSelectedCase({
                ...selectedCase,
                assignee: updatedData.assignee
            })
        }
    }

    const handleTechnicianCreated = () => {
        console.log('Technician created')
    }

    // Get status badge variant
    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status.toLowerCase()) {
            case 'open':
                return 'default'
            case 'in_progress':
            case 'in progress':
                return 'secondary'
            case 'resolved':
                return 'outline'
            case 'closed':
                return 'outline'
            case 'partial':
                return 'secondary'
            default:
                return 'secondary'
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto py-6">
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto py-6">
                <div className="p-8 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>All Cases</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={isRefetching}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                                <UsersDialog />
                                <SdrDumpDialog />
                                <CreateTechnicianDialog onSuccess={handleTechnicianCreated} />
                                <CreateCaseDialog onSuccess={handleCaseCreated} />
                            </div>
                        </CardHeader>

                        <CardContent>
                            {error && (
                                <div className="text-center py-8">
                                    <p className="text-destructive mb-4">
                                        Error loading cases: {error instanceof Error ? error.message : 'Unknown error'}
                                    </p>
                                    <Button onClick={handleRefresh} variant="outline">
                                        Try Again
                                    </Button>
                                </div>
                            )}

                            {!error && (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[100px]">Case ID</TableHead>
                                                <TableHead className="min-w-[150px]">Customer</TableHead>
                                                <TableHead className="min-w-[150px]">Location</TableHead>
                                                <TableHead className="min-w-[100px]">Status</TableHead>
                                                <TableHead className="min-w-[100px]">Created</TableHead>
                                                <TableHead className="min-w-[100px] text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cases?.map(item => (
                                                <TableRow
                                                    key={item.case_id}
                                                    className="hover:bg-muted cursor-pointer"
                                                    onClick={() => setSelectedCase(item)}
                                                >
                                                    <TableCell className="font-bold text-xs whitespace-nowrap">
                                                        {item.case_id}
                                                    </TableCell>

                                                    <TableCell className="whitespace-nowrap">
                                                        <div>
                                                            <p className="font-medium">{item.customer_name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {item.customer_email}
                                                            </p>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="whitespace-nowrap">
                                                        <div>
                                                            <p>{item.city}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {item.state} - {item.pin_code}
                                                            </p>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="whitespace-nowrap">
                                                        <Badge variant={getStatusVariant(getCaseDisplayStatus(item))}>
                                                            {getCaseDisplayStatus(item)}
                                                        </Badge>
                                                    </TableCell>

                                                    <TableCell className="whitespace-nowrap">
                                                        {new Date(item.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </TableCell>

                                                    <TableCell onClick={(e) => e.stopPropagation()} className="whitespace-nowrap">
                                                        <div className="flex gap-2 justify-center">
                                                            {canAssignCase(item) && (
                                                                <AssignCaseDialog
                                                                    caseId={item.case_id}
                                                                    onSuccess={handleCaseAssigned}
                                                                />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}

                                            {cases?.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                        No cases found
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {selectedCase && (
                        <ViewCaseDialog
                            data={selectedCase}
                            onClose={() => setSelectedCase(null)}
                            onCaseUpdated={handleRefresh}
                        />
                    )}
                </div>
            </main>
        </div>
    )
}