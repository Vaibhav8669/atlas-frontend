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
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, CheckCircle2, Calendar, Clock, Users } from 'lucide-react'
import { assignCase } from '@/lib/assigncase'
import { getAllUsers, type User } from '../lib/users'

type Props = {
    caseId: string
    onSuccess?: (updatedData: { case_id: string; assignee: string; technician_name?: string }) => void
}

export default function AssignCaseDialog({ caseId, onSuccess }: Props) {
    const [open, setOpen] = useState(false)
    const [assignee, setAssignee] = useState('')
    const [scheduledDate, setScheduledDate] = useState('')
    const [scheduledTime, setScheduledTime] = useState('')
    const [timeError, setTimeError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedTechnician, setSelectedTechnician] = useState<User | null>(null)

    const [technicians, setTechnicians] = useState<User[]>([])
    const [usersLoading, setUsersLoading] = useState(false)
    const [usersError, setUsersError] = useState<string | null>(null)

    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)

    useEffect(() => {
        if (open) {
            fetchTechnicians()
        }
    }, [open])

    useEffect(() => {
        if (assignee) {
            const tech = technicians.find(t => t.user_id === assignee)
            setSelectedTechnician(tech || null)
        } else {
            setSelectedTechnician(null)
        }
    }, [assignee, technicians])

    const fetchTechnicians = async () => {
        setUsersLoading(true)
        setUsersError(null)
        try {
            const response = await getAllUsers()
            const techs = response.data.filter(user =>
                user.role === 'technician' && user.is_active
            )
            setTechnicians(techs)
        } catch (err: any) {
            setUsersError(err.message || 'Failed to load technicians')
            console.error('Error fetching technicians:', err)
        } finally {
            setUsersLoading(false)
        }
    }

    useEffect(() => {
        if (scheduledDate && scheduledTime) {
            const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
            const now = new Date()

            if (selectedDateTime < now) {
                setTimeError('Selected time must be in the future')
            } else {
                setTimeError(null)
            }
        } else {
            setTimeError(null)
        }
    }, [scheduledDate, scheduledTime])

    async function handleAssign() {
        if (!assignee) return

        setLoading(true)
        setError(null)

        try {
            let scheduledAtEpoch: number | undefined = undefined

            if (scheduledDate && scheduledTime && !timeError) {
                const dateTimeString = `${scheduledDate}T${scheduledTime}`
                scheduledAtEpoch = Math.floor(new Date(dateTimeString).getTime() / 1000)
            }

            console.log('🚀 Calling assignCase with:', { caseId, assignee, scheduledAtEpoch })

            const result = await assignCase(caseId, assignee, scheduledAtEpoch)
            console.log('✅ Assign result:', result)

            // Pass back the updated data
            if (onSuccess) {
                onSuccess({
                    case_id: caseId,
                    assignee: assignee,
                    technician_name: selectedTechnician?.name
                })
            }

            setSuccess(true)

        } catch (err: any) {
            console.error('❌ Assignment failed:', err)
            setError(err.message || 'Failed to assign case')
        } finally {
            setLoading(false)
        }
    }

    function resetAndClose() {
        setOpen(false)
        setSuccess(false)
        // Reset form states after a small delay to avoid UI flicker
        setTimeout(() => {
            setAssignee('')
            setScheduledDate('')
            setScheduledTime('')
            setTimeError(null)
            setError(null)
            setTechnicians([])
            setSelectedTechnician(null)
        }, 100)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    Assign
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-sm">
                {!success ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Assign Case</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label>Case ID</Label>
                                <Input value={caseId} disabled className="font-mono text-xs" />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Select Technician
                                </Label>

                                {usersLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : usersError ? (
                                    <div className="text-sm text-destructive p-2 border rounded-lg">
                                        Failed to load technicians.
                                        <Button
                                            variant="link"
                                            className="px-1 h-auto text-destructive"
                                            onClick={fetchTechnicians}
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                ) : (
                                    <Select
                                        value={assignee}
                                        onValueChange={setAssignee}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a technician" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {technicians.length > 0 ? (
                                                technicians.map((tech) => (
                                                    <SelectItem
                                                        key={tech.user_id}
                                                        value={tech.user_id}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{tech.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {tech.email}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                                    No technicians available
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}

                                {selectedTechnician && (
                                    <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                                        <p className="text-xs font-medium">Selected:</p>
                                        <p className="text-sm">{selectedTechnician.name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedTechnician.email}</p>
                                    </div>
                                )}

                                {!usersLoading && !usersError && technicians.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {technicians.length} technician(s) available
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Schedule (Optional)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            value={scheduledDate}
                                            min={currentDate}
                                            onChange={e => setScheduledDate(e.target.value)}
                                            className="pr-8"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={e => setScheduledTime(e.target.value)}
                                            className="pr-8"
                                            step="60"
                                        />
                                    </div>
                                </div>

                                {timeError && (
                                    <p className="text-xs text-destructive">{timeError}</p>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    {scheduledDate === currentDate
                                        ? `Select a time after ${currentTime} for today`
                                        : 'Leave empty to assign immediately'
                                    }
                                </p>
                            </div>

                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}

                            <Button
                                className="w-full"
                                onClick={handleAssign}
                                disabled={loading || !assignee || (scheduledDate && scheduledTime ? !!timeError : false)}
                            >
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {scheduledDate && scheduledTime ? 'Schedule Assignment' : 'Assign Now'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="text-center">
                            <DialogTitle className="flex flex-col items-center gap-2">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                                {scheduledDate && scheduledTime ? 'Case Scheduled' : 'Case Assigned'}
                            </DialogTitle>
                        </DialogHeader>

                        <p className="text-center text-sm text-muted-foreground">
                            {scheduledDate && scheduledTime
                                ? `The case has been scheduled for ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime}.`
                                : `The case has been assigned to ${selectedTechnician?.name || assignee}.`
                            }
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