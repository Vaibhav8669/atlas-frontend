import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { createTechnician } from '@/lib/technician'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Props = {
    onSuccess?: () => void
}

export default function CreateTechnicianDialog({ onSuccess }: Props) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        role: 'technician',
    })

    async function handleCreate() {
        setError(null)
        setLoading(true)

        try {
            // Combine first and last name for API
            const payload = {
                name: `${form.firstName} ${form.lastName}`.trim(),
                email: form.email,
                mobile: form.mobile,
                role: form.role,
            }

            const response = await createTechnician(payload)
            console.log('Technician created:', response)
            setSuccess(true)
            onSuccess?.()
        } catch (err: any) {
            console.error('Creation error:', err)
            setError(err.message || 'Failed to create technician')
        } finally {
            setLoading(false)
        }
    }

    function resetAndClose() {
        setOpen(false)
        setSuccess(false)
        setError(null)
        setForm({
            firstName: '',
            lastName: '',
            email: '',
            mobile: '',
            role: 'technician',
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">Create Technician</Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
                {!success ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Create Technician</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label>First Name</Label>
                                    <Input
                                        value={form.firstName}
                                        onChange={e =>
                                            setForm({ ...form, firstName: e.target.value })
                                        }
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <Label>Last Name</Label>
                                    <Input
                                        value={form.lastName}
                                        onChange={e =>
                                            setForm({ ...form, lastName: e.target.value })
                                        }
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={e =>
                                        setForm({ ...form, email: e.target.value })
                                    }
                                    placeholder="technician@example.com"
                                />
                            </div>

                            <div>
                                <Label>Mobile</Label>
                                <Input
                                    placeholder="+919876543210"
                                    value={form.mobile}
                                    onChange={e =>
                                        setForm({ ...form, mobile: e.target.value })
                                    }
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                className="w-full"
                                onClick={handleCreate}
                                disabled={loading}
                            >
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {loading ? 'Creating…' : 'Create Technician'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="text-center">
                            <DialogTitle className="flex flex-col items-center gap-2">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                                Technician Created
                            </DialogTitle>
                        </DialogHeader>

                        <p className="text-center text-sm text-muted-foreground">
                            The technician account has been created successfully.
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