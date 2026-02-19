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
import { Loader2, CheckCircle2 } from 'lucide-react'
import { assignCase } from '@/lib/assigncase'
import { getAllUsers, type User as UserType } from '../lib/users'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'

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
    const [selectedTechnician, setSelectedTechnician] = useState<UserType | null>(null)

    const [technicians, setTechnicians] = useState<UserType[]>([])
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

            console.log('Calling assignCase with:', { caseId, assignee, scheduledAtEpoch })

            const result = await assignCase(caseId, assignee, scheduledAtEpoch)
            console.log('Assign result:', result)

            if (onSuccess) {
                onSuccess({
                    case_id: caseId,
                    assignee: assignee,
                    technician_name: selectedTechnician?.name
                })
            }

            setSuccess(true)

        } catch (err: any) {
            console.error('Assignment failed:', err)
            setError(err.message || 'Failed to assign case')
        } finally {
            setLoading(false)
        }
    }

    function resetAndClose() {
        setOpen(false)
        setSuccess(false)
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
                <Button size="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Assign
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md p-6">
                {!success ? (
                    <>
                        <DialogHeader className="pb-4">
                            <DialogTitle className="text-xl">Assign Case</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Case ID Card */}
                            <Card className="bg-muted/30 p-4 border-dashed">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-xs font-bold text-primary">ID</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Case ID</p>
                                        <p className="font-mono text-sm font-semibold">{caseId}</p>
                                    </div>
                                </div>
                            </Card>

                            <Separator />

                            {/* Technician Selection */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">
                                    Select Technician
                                </Label>

                                {usersLoading ? (
                                    <div className="flex items-center justify-center py-6 bg-muted/20 rounded-lg">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : usersError ? (
                                    <div className="text-sm text-destructive p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                                        <p className="mb-2">Failed to load technicians.</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-destructive text-destructive hover:bg-destructive/10"
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
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Choose a technician" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {technicians.length > 0 ? (
                                                technicians.map((tech) => (
                                                    <SelectItem
                                                        key={tech.user_id}
                                                        value={tech.user_id}
                                                        className="py-3"
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-medium">{tech.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {tech.email}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                                    No technicians available
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}

                                {selectedTechnician && (
                                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                        <p className="text-xs font-medium text-primary mb-1">Selected Technician</p>
                                        <div>
                                            <p className="text-sm font-medium">{selectedTechnician.name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedTechnician.email}</p>
                                        </div>
                                    </div>
                                )}

                                {!usersLoading && !usersError && technicians.length > 0 && (
                                    <p className="text-xs text-muted-foreground italic">
                                        {technicians.length} active technician(s) available
                                    </p>
                                )}
                            </div>

                            <Separator />

                            {/* Schedule Section */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">
                                    Schedule (Optional)
                                </Label>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Date</Label>
                                        <Input
                                            type="date"
                                            value={scheduledDate}
                                            min={currentDate}
                                            onChange={e => setScheduledDate(e.target.value)}
                                            className="h-10"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Time</Label>
                                        <Input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={e => setScheduledTime(e.target.value)}
                                            className="h-10"
                                            step="60"
                                        />
                                    </div>
                                </div>

                                {timeError && (
                                    <p className="text-xs text-destructive flex items-center gap-1 bg-destructive/5 p-2 rounded">
                                        {timeError}
                                    </p>
                                )}

                                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                    {scheduledDate === currentDate
                                        ? `Select a time after ${currentTime} for today`
                                        : 'Leave empty to assign immediately'
                                    }
                                </p>
                            </div>

                            {error && (
                                <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                                    <p className="text-sm text-destructive">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <Button
                                className="w-full h-11 text-base font-medium mt-4"
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
                        <DialogHeader className="text-center pb-4">
                            <DialogTitle className="flex flex-col items-center gap-4">
                                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                </div>
                                <span className="text-2xl">
                                    {scheduledDate && scheduledTime ? 'Case Scheduled!' : 'Case Assigned!'}
                                </span>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="bg-muted/30 p-4 rounded-lg text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                {scheduledDate && scheduledTime
                                    ? `The case has been scheduled for ${new Date(scheduledDate).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })} at ${scheduledTime}.`
                                    : `The case has been assigned to ${selectedTechnician?.name || assignee}.`
                                }
                            </p>
                        </div>

                        <Button className="w-full mt-6 h-11" onClick={resetAndClose}>
                            Done
                        </Button>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}