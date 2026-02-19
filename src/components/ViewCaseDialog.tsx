import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import CloseTicketDialog from '@/components/CloseTicketDialog'
import { apiGet } from '@/lib/api'

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
    sdr_code?: string
    tx_defect?: string
    tx_repair?: string
    resolution?: string
    tx_symptom?: string
    tx_comments?: string
    linked_case_id?: string
}

type CaseItem = {
    case_id: string
    status: string
    sub_status: string
    assignee: string
    sla_time: string
    scheduled_at: string
    customer_name: string
    customer_email: string
    customer_mobile: string
    customer_type: string  // Add this field
    street1: string
    street2: string
    city: string
    state: string
    tickets_data: Ticket[]
}

type Props = {
    data: CaseItem
    onClose: () => void
    onCaseUpdated?: () => void
}

export default function ViewCaseDialog({ data, onClose, onCaseUpdated }: Props) {
    const [caseData, setCaseData] = useState<CaseItem>(data)
    const [loading, setLoading] = useState(false)

    // Update when prop data changes
    useEffect(() => {
        setCaseData(data)
    }, [data])

    // Fetch updated case data
    const refreshCaseData = async () => {
        setLoading(true)
        try {
            const response = await apiGet<{ data: CaseItem }>(`/get_case/${data.case_id}`)
            setCaseData(response.data)
        } catch (error) {
            console.error('Failed to refresh case:', error)
        } finally {
            setLoading(false)
        }
    }

    // Handle ticket closed successfully
    const handleTicketClosed = (closedTicketId: string, updatedData?: any) => {
        setLoading(true)

        if (updatedData) {
            const updatedTickets = caseData.tickets_data.map(ticket =>
                ticket.ticket_id === closedTicketId
                    ? { ...ticket, ...updatedData, status: 'CLOSED' }
                    : ticket
            )

            setCaseData({
                ...caseData,
                tickets_data: updatedTickets
            })
        }

        if (onCaseUpdated) {
            onCaseUpdated()
        }

        setLoading(false)
    }

    // Handle assignee update
    const handleAssigneeUpdate = () => {
        refreshCaseData()
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
            default:
                return 'secondary'
        }
    }

    // Get customer type badge variant
    const getCustomerTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (type) {
            case 'B2C':
                return 'default'
            case 'B2B':
                return 'secondary'
            case 'B2G':
                return 'outline'
            default:
                return 'secondary'
        }
    }

    // Calculate case status based on tickets
    const getCaseStatus = () => {
        const tickets = caseData.tickets_data
        const openTickets = tickets.filter(t => t.status === 'OPEN').length
        const closedTickets = tickets.filter(t => t.status === 'CLOSED').length

        if (closedTickets === tickets.length) return 'CLOSED'
        if (openTickets > 0 && closedTickets > 0) return 'PARTIAL'
        return caseData.status
    }

    const displayStatus = getCaseStatus()

    // Get assignee display name
    const getAssigneeDisplay = () => {
        if (caseData.assignee === 'UNKNOWN' || !caseData.assignee) {
            return 'Not Assigned'
        }
        return caseData.assignee
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Case Details</DialogTitle>
                </DialogHeader>

                {loading && (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                )}

                {/* CASE INFO */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><b>Case ID:</b> {caseData.case_id}</div>
                    <div>
                        <b>Status:</b>{' '}
                        <Badge variant={getStatusVariant(displayStatus)}>
                            {displayStatus}
                        </Badge>
                    </div>
                    <div><b>Sub Status:</b> {caseData.sub_status}</div>
                    <div>
                        <b>Assigned To:</b>{' '}
                        <span className="font-medium">{getAssigneeDisplay()}</span>
                    </div>
                    <div><b>SLA (hrs):</b> {caseData.sla_time}</div>
                    <div>
                        <b>Scheduled At:</b>{' '}
                        {new Date(caseData.scheduled_at).toLocaleString()}
                    </div>
                    <div>
                        <b>Customer Type:</b>{' '}
                        <Badge variant={getCustomerTypeVariant(caseData.customer_type)}>
                            {caseData.customer_type}
                        </Badge>
                    </div>
                </div>

                <Separator className="my-6" />

                {/* CUSTOMER */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><b>Name:</b> {caseData.customer_name}</div>
                    <div><b>Email:</b> {caseData.customer_email}</div>
                    <div><b>Mobile:</b> {caseData.customer_mobile}</div>
                    <div className="col-span-2">
                        <b>Address:</b>{' '}
                        {caseData.street1}, {caseData.street2}, {caseData.city}, {caseData.state}
                    </div>
                </div>

                <Separator className="my-6" />

                {/* TICKETS */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Tickets</h3>

                    {caseData.tickets_data.map(ticket => (
                        <div
                            key={ticket.ticket_id}
                            className="border rounded-lg p-4 space-y-3"
                        >
                            <div className="flex justify-between items-center">
                                <p className="font-medium">{ticket.ticket_id}</p>
                                <Badge variant={getStatusVariant(ticket.status)}>
                                    {ticket.status}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><b>Issue:</b> {ticket.issue_type}</div>
                                <div><b>Description:</b> {ticket.description}</div>
                                <div><b>Serial:</b> {ticket.serial_number}</div>
                                <div><b>Purchase Date:</b> {ticket.purchase_date}</div>
                                <div>
                                    <b>Product:</b> {ticket.product_type} – {ticket.product_subtype}
                                </div>
                                <div>
                                    <b>Warranty:</b> {ticket.warranty_status ?? 'Unknown'}
                                </div>
                            </div>

                            {ticket.status === 'CLOSED' && (
                                <>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 p-3 rounded-lg">
                                        <div className="col-span-2">
                                            <b>Resolution Details</b>
                                        </div>
                                        {ticket.sdr_code && (
                                            <div><b>SDR Code:</b> {ticket.sdr_code}</div>
                                        )}
                                        {ticket.resolution && (
                                            <div><b>Resolution:</b> {ticket.resolution}</div>
                                        )}
                                        {ticket.tx_symptom && (
                                            <div><b>Symptom:</b> {ticket.tx_symptom}</div>
                                        )}
                                        {ticket.tx_defect && (
                                            <div><b>Defect:</b> {ticket.tx_defect}</div>
                                        )}
                                        {ticket.tx_repair && (
                                            <div><b>Repair:</b> {ticket.tx_repair}</div>
                                        )}
                                        {ticket.tx_comments && (
                                            <div className="col-span-2">
                                                <b>Comments:</b> {ticket.tx_comments}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {ticket.status === 'OPEN' && (
                                <div className="pt-2">
                                    <CloseTicketDialog
                                        ticketId={ticket.ticket_id}
                                        onSuccess={(updatedData) => handleTicketClosed(ticket.ticket_id, updatedData)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <Button className="w-full mt-6" onClick={onClose}>
                    Close
                </Button>
            </DialogContent>
        </Dialog>
    )
}