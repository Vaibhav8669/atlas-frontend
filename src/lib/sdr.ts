import { apiGet } from './api'
import type { SdrRecord } from '@/stores/sdr-store'

export type SdrDumpResponse = {
    status: string
    message: string
    data: string // CSV string
}

export async function getSdrDump() {
    return apiGet<SdrDumpResponse>('/get_sdr_dump')
}

// Parse CSV string to array of objects
export function parseSdrCsv(csvText: string): SdrRecord[] {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',')

    return lines.slice(1).map(line => {
        const values = line.split(',')
        const record: any = {}

        headers.forEach((header, index) => {
            record[header.trim()] = values[index]?.trim() || ''
        })

        return record as SdrRecord
    })
}