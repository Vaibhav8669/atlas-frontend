import { useState, useEffect } from 'react'
import { apiPost } from '@/lib/api'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Loader2, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { validateSerialNumber } from '@/lib/serialValidation'
import { useToast } from "@/hooks/use-toast"

type Props = {
    onSuccess: () => void
}

type Ticket = {
    issue_type: string
    description: string
    serial_number: string
    purchase_date: string
    product_type: string
    product_subtype: string
    device_mac_id: string
    serialStatus: 'idle' | 'validating' | 'valid' | 'invalid'
    serialMessage?: string
    modelName?: string      // Add model name from response
    warrantyStatus?: string // Add warranty status from response
}

type ApiResponse = {
    status: string
    message: string
    CaseID: string
}

// Constants
const CUSTOMER_TYPES = [
    { value: 'B2C', label: 'B2C - Business to Consumer' },
    { value: 'B2B', label: 'B2B - Business to Business' },
    { value: 'B2G', label: 'B2G - Business to Government' },
] as const

const TICKET_TYPES = [
    { value: 'Repair', label: 'Repair' },
    { value: 'Preventive Maintenance', label: 'Preventive Maintenance' },
    { value: 'Installation', label: 'Installation' },
    { value: 'Inspection', label: 'Inspection' },
    { value: 'Product Demo', label: 'Product Demo' },
] as const

// B2C only gets first 3 ticket types
const B2C_TICKET_TYPES = TICKET_TYPES.slice(0, 3)

export default function CreateCaseDialog({ onSuccess }: Props) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [success, setSuccess] = useState(false)
    const [caseId, setCaseId] = useState<string>('')

    const [form, setForm] = useState({
        request_type: 'Repair',
        customer_name: '',
        customer_email: '',
        customer_mobile: '',
        pin_code: '',
        city: '',
        state: '',
        street1: '',
        street2: '',
        customer_type: 'B2C',
        sla_time: 72,
    })

    const [tickets, setTickets] = useState<Ticket[]>([
        {
            issue_type: '',
            description: '',
            serial_number: '',
            purchase_date: new Date().toISOString().split('T')[0],
            product_type: 'FAN',
            product_subtype: 'Ceiling Fan',
            device_mac_id: '',
            serialStatus: 'idle',
        },
    ])

    // Get available ticket types based on customer type
    const getAvailableTicketTypes = () => {
        if (form.customer_type === 'B2C') {
            return B2C_TICKET_TYPES
        }
        return TICKET_TYPES // B2B and B2G get all types
    }

    // Reset issue_type if current selection is not available for new customer type
    useEffect(() => {
        const availableTypes = getAvailableTicketTypes().map(t => t.value)
        const updatedTickets = tickets.map(ticket => {
            if (!availableTypes.includes(ticket.issue_type)) {
                return { ...ticket, issue_type: '' }
            }
            return ticket
        })
        setTickets(updatedTickets)
    }, [form.customer_type])

    // Check if serial number is valid (16 digits, can include letters)
    const isValidSerialLength = (serial: string) => {
        return serial.replace(/\s/g, '').length === 16
    }

    /* ───────────────────────── Serial Validation ───────────────────────── */

    async function validateSerial(index: number) {
        const ticket = tickets[index]

        if (!ticket.serial_number.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a serial number',
                variant: 'destructive',
            })
            return
        }

        if (!isValidSerialLength(ticket.serial_number)) {
            toast({
                title: 'Invalid Serial',
                description: 'Serial number must be exactly 16 characters',
                variant: 'destructive',
            })
            return
        }

        const updated = [...tickets]
        updated[index].serialStatus = 'validating'
        updated[index].serialMessage = undefined
        setTickets(updated)

        try {
            const timestamp = Date.now()
            const result = await validateSerialNumber(ticket.serial_number, timestamp)

            if (result.valid && result.data) {
                // Extract model info from response
                const modelInfo = result.data

                updated[index].serialStatus = 'valid'
                updated[index].serialMessage = result.message
                updated[index].modelName = modelInfo.model_name || modelInfo.model
                updated[index].warrantyStatus = modelInfo.warranty_status

                // Auto-fill product details if returned
                if (modelInfo.product_type) {
                    updated[index].product_type = modelInfo.product_type
                }
                if (modelInfo.product_subtype) {
                    updated[index].product_subtype = modelInfo.product_subtype
                }

                toast({
                    title: 'Success',
                    description: `Serial verified. Model: ${updated[index].modelName}`,
                })
            } else {
                updated[index].serialStatus = 'invalid'
                updated[index].serialMessage = result.message

                toast({
                    title: 'Validation Failed',
                    description: result.message,
                    variant: 'destructive',
                })
            }
        } catch (error) {
            updated[index].serialStatus = 'invalid'
            updated[index].serialMessage = 'Validation failed. Please try again.'

            toast({
                title: 'Error',
                description: 'Failed to validate serial number',
                variant: 'destructive',
            })
        } finally {
            setTickets([...updated])
        }
    }

    function addTicket() {
        setTickets([
            ...tickets,
            {
                issue_type: '',
                description: '',
                serial_number: '',
                purchase_date: new Date().toISOString().split('T')[0],
                product_type: 'FAN',
                product_subtype: 'Ceiling Fan',
                device_mac_id: '',
                serialStatus: 'idle',
            },
        ])
    }

    function removeTicket(index: number) {
        setTickets(tickets.filter((_, i) => i !== index))
    }

    /* ───────────────────────── Submit ───────────────────────── */

    async function handleCreate() {
        const invalidSerials = tickets.filter(t =>
            t.serial_number.trim() !== '' && t.serialStatus === 'invalid'
        )

        if (invalidSerials.length > 0) {
            toast({
                title: 'Validation Error',
                description: 'Please fix invalid serial numbers or remove them',
                variant: 'destructive',
            })
            return
        }

        const unvalidatedSerials = tickets.filter(t =>
            t.serial_number.trim() !== '' && t.serialStatus === 'idle'
        )

        if (unvalidatedSerials.length > 0) {
            toast({
                title: 'Validation Error',
                description: 'Please validate entered serial numbers or remove them',
                variant: 'destructive',
            })
            return
        }

        if (!form.customer_name || !form.customer_email || !form.customer_mobile) {
            toast({
                title: 'Validation Error',
                description: 'Please fill all required customer fields',
                variant: 'destructive',
            })
            return
        }

        setLoading(true)
        try {
            const response = await apiPost<ApiResponse>('/create_case', {
                source: 'IOT App',
                ...form,
                pin_code: Number(form.pin_code) || 0,
                tickets_data: tickets.map(({ serialStatus, serialMessage, modelName, warrantyStatus, ...t }) => t),
            })

            setCaseId(response.CaseID)
            setSuccess(true)

        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create case',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    function resetAndClose() {
        setOpen(false)
        setSuccess(false)
        setCaseId('')
        setForm({
            request_type: 'Repair',
            customer_name: '',
            customer_email: '',
            customer_mobile: '',
            pin_code: '',
            city: '',
            state: '',
            street1: '',
            street2: '',
            customer_type: 'B2C',
            sla_time: 72,
        })
        setTickets([{
            issue_type: '',
            description: '',
            serial_number: '',
            purchase_date: '',
            product_type: 'FAN',
            product_subtype: 'Ceiling Fan',
            device_mac_id: '',
            serialStatus: 'idle',
        }])
        onSuccess()
    }

    const availableTicketTypes = getAvailableTicketTypes()

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Case</Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                {!success ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Create New Case</DialogTitle>
                        </DialogHeader>

                        {/* CUSTOMER DETAILS */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                ['Customer Name *', 'customer_name', true],
                                ['Email *', 'customer_email', true],
                                ['Mobile *', 'customer_mobile', true],
                                ['Pincode', 'pin_code', false],
                                ['City', 'city', false],
                                ['State', 'state', false],
                                ['Street 1', 'street1', false],
                                ['Street 2', 'street2', false],
                            ].map((item) => {
                                const [label, fieldName, required] = item
                                const field = fieldName as keyof typeof form
                                return (
                                    <div key={field}>
                                        <Label>{label}</Label>
                                        <Input
                                            required={required as boolean}
                                            value={form[field] || ''}
                                            onChange={e =>
                                                setForm({ ...form, [field]: e.target.value })
                                            }
                                        />
                                    </div>
                                )
                            })}

                            {/* Customer Type Dropdown */}
                            <div className="col-span-2">
                                <Label htmlFor="customer_type">Customer Type *</Label>
                                <Select
                                    value={form.customer_type}
                                    onValueChange={(value: string) =>
                                        setForm({ ...form, customer_type: value })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select customer type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CUSTOMER_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* TICKETS */}
                        <div className="space-y-6 mt-6">
                            {tickets.map((ticket, i) => (
                                <div key={i} className="border rounded-lg p-4 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold">Ticket {i + 1}</h3>
                                        {tickets.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeTicket(i)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Issue Date - Display only */}
                                    <div>
                                        <Label>Issue Date</Label>
                                        <Input
                                            type="date"
                                            value={new Date().toISOString().split('T')[0]}
                                            disabled
                                            className="bg-muted"
                                        />
                                    </div>

                                    {/* Issue Type Dropdown - Filtered by Customer Type */}
                                    <div>
                                        <Label htmlFor={`issue-type-${i}`}>Issue Type *</Label>
                                        <Select
                                            value={ticket.issue_type}
                                            onValueChange={(value: string) => {
                                                const t = [...tickets]
                                                t[i].issue_type = value
                                                setTickets(t)
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select issue type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableTicketTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <Label htmlFor={`description-${i}`}>Description *</Label>
                                        <Textarea
                                            id={`description-${i}`}
                                            placeholder="Detailed description of the issue"
                                            required
                                            value={ticket.description}
                                            onChange={e => {
                                                const t = [...tickets]
                                                t[i].description = e.target.value
                                                setTickets(t)
                                            }}
                                        />
                                    </div>

                                    {/* Purchase Date */}
                                    <div>
                                        <Label htmlFor={`purchase-date-${i}`}>Purchase Date *</Label>
                                        <Input
                                            id={`purchase-date-${i}`}
                                            type="date"
                                            value={ticket.purchase_date}
                                            max={new Date().toISOString().split('T')[0]}
                                            required
                                            onChange={e => {
                                                const t = [...tickets]
                                                t[i].purchase_date = e.target.value
                                                setTickets(t)
                                            }}
                                        />
                                    </div>

                                    {/* Serial Number */}
                                    <div>
                                        <Label htmlFor={`serial-${i}`}>
                                            Serial Number {isValidSerialLength(ticket.serial_number) ? '✓' : '(16 characters required)'}
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id={`serial-${i}`}
                                                placeholder="Enter 16-digit serial number"
                                                value={ticket.serial_number}
                                                onChange={e => {
                                                    const t = [...tickets]
                                                    t[i].serial_number = e.target.value.toUpperCase()
                                                    t[i].serialStatus = 'idle'
                                                    setTickets(t)
                                                }}
                                                className={!isValidSerialLength(ticket.serial_number) && ticket.serial_number ? 'border-black-500' : ''}
                                            />
                                            <Button
                                                variant="default"
                                                onClick={() => validateSerial(i)}
                                                disabled={
                                                    ticket.serialStatus === 'validating' ||
                                                    !ticket.serial_number.trim() ||
                                                    !isValidSerialLength(ticket.serial_number)
                                                }
                                            >
                                                {ticket.serialStatus === 'validating' ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    'Validate'
                                                )}
                                            </Button>
                                        </div>
                                        {ticket.serial_number && !isValidSerialLength(ticket.serial_number)}
                                    </div>

                                    {/* Serial Status Messages */}
                                    {ticket.serialStatus === 'valid' && (
                                        <div className="space-y-2">
                                            <p className="text-green-600 flex items-center gap-1 text-sm">
                                                <CheckCircle2 className="h-4 w-4" /> Verified
                                            </p>
                                            {ticket.modelName && (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                                                    <p className="font-medium text-green-800">Model Information:</p>
                                                    <p className="text-green-700 mt-1">Model: {ticket.modelName}</p>
                                                    {ticket.warrantyStatus && (
                                                        <p className="text-green-700">Warranty: {ticket.warrantyStatus}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {ticket.serialStatus === 'invalid' && (
                                        <p className="text-red-600 flex items-center gap-1 text-sm">
                                            <XCircle className="h-4 w-4" /> {ticket.serialMessage}
                                        </p>
                                    )}

                                    {/* Product Fields */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor={`product-type-${i}`}>Product Type</Label>
                                            <Input
                                                id={`product-type-${i}`}
                                                value={ticket.product_type}
                                                placeholder="e.g., FAN"
                                                onChange={e => {
                                                    const t = [...tickets]
                                                    t[i].product_type = e.target.value
                                                    setTickets(t)
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`product-subtype-${i}`}>Product Subtype</Label>
                                            <Input
                                                id={`product-subtype-${i}`}
                                                value={ticket.product_subtype}
                                                placeholder="e.g., Ceiling Fan"
                                                onChange={e => {
                                                    const t = [...tickets]
                                                    t[i].product_subtype = e.target.value
                                                    setTickets(t)
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Device MAC ID */}
                                    <div>
                                        <Label htmlFor={`mac-id-${i}`}>Device MAC ID (optional)</Label>
                                        <Input
                                            id={`mac-id-${i}`}
                                            value={ticket.device_mac_id}
                                            placeholder="AA:BB:CC:DD:EE:FF"
                                            onChange={e => {
                                                const t = [...tickets]
                                                t[i].device_mac_id = e.target.value
                                                setTickets(t)
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}

                            <Button variant="outline" onClick={addTicket}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add another ticket
                            </Button>
                        </div>

                        <Button
                            className="w-full mt-6"
                            onClick={handleCreate}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Creating…' : 'Create Case'}
                        </Button>
                    </>
                ) : (
                    // SUCCESS STATE
                    <>
                        <DialogHeader className="text-center">
                            <DialogTitle className="flex flex-col items-center gap-2">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                                Case Created
                            </DialogTitle>
                        </DialogHeader>

                        <div className="text-center space-y-3">
                            <p className="text-sm text-muted-foreground">
                                The case has been created successfully.
                            </p>

                            <div className="bg-muted p-3 rounded-lg space-y-2">
                                <p className="text-xs text-muted-foreground">Case ID:</p>
                                <p className="text-sm font-mono font-semibold">{caseId}</p>
                            </div>

                            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                                <p className="text-xs text-muted-foreground">Tickets Created:</p>
                                <p className="text-sm font-mono">{tickets.length}</p>
                            </div>
                        </div>

                        <Button className="w-full mt-4" onClick={resetAndClose}>
                            Done
                        </Button>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}