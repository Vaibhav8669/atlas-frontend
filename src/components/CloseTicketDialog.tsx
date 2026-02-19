import { useState } from 'react'
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
import { Loader2, CheckCircle2 } from 'lucide-react'

type Props = {
    ticketId: string
    onSuccess?: (updatedTicket?: any) => void // Change to accept data
}

export default function CloseTicketDialog({ ticketId, onSuccess }: Props) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const [form, setForm] = useState({
        sdr_code: '',
        tx_comments: '',
        tx_symptom: '',
        tx_defect: '',
        tx_repair: '',
        resolution: '',
    })

    async function handleClose() {
        setLoading(true)
        try {
            const response = await apiPost('/close_ticket', {
                ticket_id: ticketId,
                ...form,
            })
            setSuccess(true)
            // Store the response data to pass back
            // The response might contain the updated ticket data
        } catch (error) {
            console.error('Close ticket error:', error)
        } finally {
            setLoading(false)
        }
    }

    function resetAndClose() {
        setOpen(false)
        setSuccess(false)
        // Pass the form data as updated ticket info
        const updatedTicket = {
            ticket_id: ticketId,
            status: 'CLOSED',
            sdr_code: form.sdr_code,
            tx_comments: form.tx_comments,
            tx_symptom: form.tx_symptom,
            tx_defect: form.tx_defect,
            tx_repair: form.tx_repair,
            resolution: form.resolution,
        }
        onSuccess?.(updatedTicket) // Pass the data back
        setForm({
            sdr_code: '',
            tx_comments: '',
            tx_symptom: '',
            tx_defect: '',
            tx_repair: '',
            resolution: '',
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="destructive">
                    Close Ticket
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
                {!success ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Close Ticket</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label>SDR Code</Label>
                                <Input
                                    placeholder="SYM008DEF0051REP010"
                                    value={form.sdr_code}
                                    onChange={e => setForm({ ...form, sdr_code: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Symptom</Label>
                                <Input
                                    placeholder="Dead / Not Working"
                                    value={form.tx_symptom}
                                    onChange={e => setForm({ ...form, tx_symptom: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Defect</Label>
                                <Input
                                    placeholder="Oscillation Is Not Working"
                                    value={form.tx_defect}
                                    onChange={e => setForm({ ...form, tx_defect: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Repair</Label>
                                <Input
                                    placeholder="Internal Adjustment Done"
                                    value={form.tx_repair}
                                    onChange={e => setForm({ ...form, tx_repair: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Resolution</Label>
                                <Input
                                    placeholder="Non-Part Call"
                                    value={form.resolution}
                                    onChange={e => setForm({ ...form, resolution: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Technician Comments</Label>
                                <Textarea
                                    placeholder="Tightened harness"
                                    value={form.tx_comments}
                                    onChange={e => setForm({ ...form, tx_comments: e.target.value })}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Closing…
                                    </>
                                ) : (
                                    'Close Ticket'
                                )}
                            </Button>
                        </div>
                    </>
                ) : (
                    // Success State
                    <>
                        <DialogHeader className="text-center">
                            <DialogTitle className="flex flex-col items-center gap-2">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                                Ticket Closed
                            </DialogTitle>
                        </DialogHeader>

                        <p className="text-center text-sm text-muted-foreground">
                            The ticket has been closed successfully.
                        </p>

                        <Button className="w-full mt-4" onClick={resetAndClose}>
                            Done
                        </Button>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}