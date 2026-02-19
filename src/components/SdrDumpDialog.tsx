import { useState, useRef, useCallback, useEffect } from 'react'
import { useVirtual } from 'react-virtual'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
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
import { Loader2, Database, Search, X, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSdrStore, type SdrRecord } from '@/stores/sdr-store'
import { getSdrDump, parseSdrCsv } from '@/lib/sdr'

export function SdrDumpDialog() {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const { sdrData, setSdrData, setLoading: setStoreLoading } = useSdrStore()

    // Refs for virtual scrolling
    const tableContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        console.log('SDR Data in store:', sdrData.length)
    }, [sdrData])

    // Auto-fetch EVERY TIME dialog opens
    useEffect(() => {
        if (open) {
            handleFetchSdr()
        }
    }, [open])

    const handleFetchSdr = async () => {
        setLoading(true)
        setStoreLoading(true)

        try {
            const response = await getSdrDump()
            console.log('Raw response:', response)
            const parsedData = parseSdrCsv(response.data)
            console.log('Parsed data:', parsedData.length)
            setSdrData(parsedData)

            toast({
                title: 'Success',
                description: `Loaded ${parsedData.length} SDR records`,
            })

            // Force virtualizer to recalculate after data loads
            setTimeout(() => {
                if (tableContainerRef.current) {
                    window.dispatchEvent(new Event('resize'))
                }
            }, 100)

        } catch (error) {
            console.error('SDR Dump error:', error)
            toast({
                title: 'Error',
                description: 'Failed to fetch SDR data',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
            setStoreLoading(false)
        }
    }

    // Filter data based on search
    const filteredData = sdrData.filter(record => {
        if (!searchTerm) return true
        const searchLower = searchTerm.toLowerCase()
        return (
            record.sdr_code?.toLowerCase().includes(searchLower) ||
            record.issue_type?.toLowerCase().includes(searchLower) ||
            record.model_name?.toLowerCase().includes(searchLower) ||
            record.symptom_desc?.toLowerCase().includes(searchLower) ||
            record.defect_desc?.toLowerCase().includes(searchLower) ||
            record.repair_desc?.toLowerCase().includes(searchLower)
        )
    })

    // Virtual scrolling setup
    const rowVirtualizer = useVirtual({
        size: filteredData.length,
        parentRef: tableContainerRef,
        estimateSize: useCallback(() => 45, []),
        overscan: 10
    })

    // Column widths
    const columnWidths = {
        sdrCode: '180px',
        issueType: '100px',
        model: '100px',
        symptom: '200px',
        defect: '200px',
        repair: '200px',
        resolution: '100px',
        part: '70px',
        sdrNumber: '150px'
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Database className="h-4 w-4 mr-2" />
                    SDR Master
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>SDR Master Data</DialogTitle>
                </DialogHeader>

                <div className="px-6 pb-6 space-y-4">
                    {/* Controls */}
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2 flex-1 max-w-sm">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search SDR codes, issues, models..."
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

                        <div className="flex gap-2">
                            <Button
                                onClick={handleFetchSdr}
                                disabled={loading}
                                size="sm"
                                variant="outline"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    {sdrData.length > 0 && (
                        <div className="flex gap-4 text-sm">
                            <Badge variant="outline">Total: {sdrData.length.toLocaleString()}</Badge>
                            <Badge variant="outline">Showing: {filteredData.length.toLocaleString()}</Badge>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {/* Virtualized Table with Horizontal Scroll */}
                    {!loading && filteredData.length > 0 ? (
                        <div
                            ref={tableContainerRef}
                            className="border rounded-lg overflow-auto"
                            style={{ height: '60vh' }}
                        >
                            <Table className="w-full" style={{ tableLayout: 'fixed' }}>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="text-left whitespace-nowrap px-4 py-3" style={{ width: columnWidths.sdrCode }}>SDR Code</TableHead>
                                        <TableHead className="text-left whitespace-nowrap px-4 py-3" style={{ width: columnWidths.issueType }}>Issue Type</TableHead>
                                        <TableHead className="text-left whitespace-nowrap px-4 py-3" style={{ width: columnWidths.model }}>Model</TableHead>
                                        <TableHead className="text-left whitespace-nowrap px-4 py-3" style={{ width: columnWidths.symptom }}>Symptom</TableHead>
                                        <TableHead className="text-left whitespace-nowrap px-4 py-3" style={{ width: columnWidths.defect }}>Defect</TableHead>
                                        <TableHead className="text-left whitespace-nowrap px-4 py-3" style={{ width: columnWidths.repair }}>Repair</TableHead>
                                        <TableHead className="text-left whitespace-nowrap px-4 py-3" style={{ width: columnWidths.resolution }}>Resolution</TableHead>
                                        <TableHead className="text-left whitespace-nowrap px-4 py-3" style={{ width: columnWidths.part }}>Part?</TableHead>
                                        <TableHead className="text-left whitespace-nowrap px-4 py-3" style={{ width: columnWidths.sdrNumber }}>SDR #</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody
                                    style={{
                                        height: `${rowVirtualizer.totalSize}px`,
                                        position: 'relative'
                                    }}
                                >
                                    {rowVirtualizer.virtualItems.map((virtualRow) => {
                                        const record = filteredData[virtualRow.index]
                                        return (
                                            <TableRow
                                                key={virtualRow.index}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: `${virtualRow.size}px`,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                }}
                                                className="hover:bg-muted/50"
                                            >
                                                <TableCell className="font-mono text-xs whitespace-nowrap text-left px-4 py-2" style={{ width: columnWidths.sdrCode }}>
                                                    {record.sdr_code}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-left px-4 py-2" style={{ width: columnWidths.issueType }}>
                                                    <Badge variant="outline" className="text-xs">
                                                        {record.issue_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs whitespace-nowrap text-left px-4 py-2" style={{ width: columnWidths.model }}>
                                                    {record.model_name}
                                                </TableCell>
                                                <TableCell className="text-xs whitespace-nowrap text-left px-4 py-2" style={{ width: columnWidths.symptom }} title={record.symptom_desc}>
                                                    {record.symptom_desc}
                                                </TableCell>
                                                <TableCell className="text-xs whitespace-nowrap text-left px-4 py-2" style={{ width: columnWidths.defect }} title={record.defect_desc}>
                                                    {record.defect_desc}
                                                </TableCell>
                                                <TableCell className="text-xs whitespace-nowrap text-left px-4 py-2" style={{ width: columnWidths.repair }} title={record.repair_desc}>
                                                    {record.repair_desc}
                                                </TableCell>
                                                <TableCell className="text-xs whitespace-nowrap text-left px-4 py-2" style={{ width: columnWidths.resolution }}>
                                                    {record.resolution_type}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-left px-4 py-2" style={{ width: columnWidths.part }}>
                                                    <Badge variant={record.is_part_consumption === '1' ? 'default' : 'secondary'} className="text-xs">
                                                        {record.is_part_consumption === '1' ? 'Yes' : 'No'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs whitespace-nowrap text-left px-4 py-2" style={{ width: columnWidths.sdrNumber }}>
                                                    {record.sdr_master_number}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : !loading && sdrData.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No SDR data available. Click Refresh to load.
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}