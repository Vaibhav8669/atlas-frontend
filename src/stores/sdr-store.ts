import { create } from 'zustand'

export type SdrRecord = {
    resolution_type: string
    configuration_desc: string
    configuration_group_code: string
    symptom_desc: string
    defect_desc: string
    repair_desc: string
    symptom_code: string
    defect_code: string
    repair_code: string
    is_part_consumption: string
    issue_type: string
    mat_group_1: string
    model_name: string
    model_name_code: string
    case_type: string
    sdr_code: string
    service_level: string
    customer_type: string
    sdr_master_id: string
    sdr_master_number: string
}

// Define the SdrState interface
interface SdrState {
    sdrData: SdrRecord[]
    isLoading: boolean
    error: string | null
    lastFetched: number | null

    // Actions
    setSdrData: (data: SdrRecord[]) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearSdrData: () => void
}

export const useSdrStore = create<SdrState>((set) => ({
    sdrData: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    setSdrData: (data) => {
        console.log('Setting SDR data:', data.length) // Debug log
        set({
            sdrData: data,
            lastFetched: Date.now(),
            error: null
        })
    },

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    clearSdrData: () => set({
        sdrData: [],
        lastFetched: null,
        error: null
    })
}))

// Add a selector to check if data needs refresh
export const useSdrNeedsRefresh = () => {
    const lastFetched = useSdrStore(state => state.lastFetched)
    const sdrData = useSdrStore(state => state.sdrData)

    if (!lastFetched || sdrData.length === 0) return true
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    return lastFetched < oneHourAgo
}