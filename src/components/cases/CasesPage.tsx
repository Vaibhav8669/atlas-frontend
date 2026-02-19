import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, ClipboardList } from 'lucide-react'
import CreateCaseDialog from '@/components/CreateCaseDialog'
import ViewCaseDialog from '@/components/ViewCaseDialog'
import { CasesTable } from './CasesTable'
import type { CaseItem } from '@/types/api'

interface CasesPageProps {
    onCaseAssigned?: (updatedData?: any) => void
}

const casesKeys = {
    all: ['cases'] as const,
}

const canAssignCase = (caseItem: CaseItem): boolean => {
    if (caseItem.status.toLowerCase() === 'closed') return false
    const hasOpenTickets = caseItem.tickets_data.some(t => t.status === 'OPEN')
    if (!hasOpenTickets) return false
    if (caseItem.assignee !== 'UNKNOWN') return false
    return true
}

const getCaseDisplayStatus = (caseItem: CaseItem): string => {
    const tickets = caseItem.tickets_data
    const openTickets = tickets.filter(t => t.status === 'OPEN').length
    const closedTickets = tickets.filter(t => t.status === 'CLOSED').length

    if (closedTickets === tickets.length) return 'CLOSED'
    if (openTickets > 0 && closedTickets > 0) return 'PARTIAL'
    return caseItem.status
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
        case 'open': return 'default'
        case 'in_progress':
        case 'in progress': return 'secondary'
        case 'resolved': return 'outline'
        case 'closed': return 'outline'
        case 'partial': return 'secondary'
        default: return 'secondary'
    }
}

export function CasesPage({ onCaseAssigned }: CasesPageProps) {
    const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null)

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
            return response.data.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })

    const handleRefresh = () => refetch()
    const handleCaseCreated = () => refetch()
    const handleCaseAssigned = (updatedData?: any) => {
        refetch()
        if (selectedCase && updatedData?.case_id === selectedCase.case_id) {
            setSelectedCase({ ...selectedCase, assignee: updatedData.assignee })
        }
        onCaseAssigned?.(updatedData)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex gap-2">
                        <ClipboardList className="h-5 w-5" />
                        <CardTitle>All Cases</CardTitle>
                    </div>
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

                    {!error && cases && (
                        <CasesTable
                            cases={cases}
                            onCaseSelect={setSelectedCase}
                            onCaseAssigned={handleCaseAssigned}
                            canAssignCase={canAssignCase}
                            getStatusVariant={getStatusVariant}
                            getCaseDisplayStatus={getCaseDisplayStatus}
                        />
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
    )
}