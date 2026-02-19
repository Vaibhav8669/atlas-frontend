import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserCheck } from 'lucide-react'
import AssignCaseDialog from '@/components/AssignCaseDialog'
import type { CaseItem } from '@/types/api'

interface CasesTableProps {
    cases: CaseItem[]
    onCaseSelect: (caseItem: CaseItem) => void
    onCaseAssigned: (updatedData?: any) => void
    canAssignCase: (caseItem: CaseItem) => boolean
    getStatusVariant: (status: string) => "default" | "secondary" | "destructive" | "outline"
    getCaseDisplayStatus: (caseItem: CaseItem) => string
}

export function CasesTable({
                               cases,
                               onCaseSelect,
                               onCaseAssigned,
                               canAssignCase,
                               getStatusVariant,
                               getCaseDisplayStatus
                           }: CasesTableProps) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="min-w-[100px]">Case ID</TableHead>
                        <TableHead className="min-w-[150px]">Customer</TableHead>
                        <TableHead className="min-w-[150px]">Location</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[100px]">Created</TableHead>
                        <TableHead className="min-w-[150px]">Assigned To / Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cases.map(item => (
                        <TableRow
                            key={item.case_id}
                            className="hover:bg-muted cursor-pointer"
                            onClick={() => onCaseSelect(item)}
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
                                <div className="flex items-center justify-center gap-2">
                                    {item.assignee !== 'UNKNOWN' ? (
                                        <div className="flex items-center gap-1 text-sm bg-muted px-2 py-1 rounded-md">
                                            <UserCheck className="h-3 w-3 text-primary" />
                                            <span className="font-medium">{item.assignee}</span>
                                        </div>
                                    ) : (
                                        canAssignCase(item) && (
                                            <AssignCaseDialog
                                                caseId={item.case_id}
                                                onSuccess={onCaseAssigned}
                                            />
                                        )
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}

                    {cases.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No cases found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}