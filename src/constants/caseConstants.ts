export const CUSTOMER_TYPES = [
    { value: 'B2C', label: 'B2C - Business to Consumer' },
    { value: 'B2B', label: 'B2B - Business to Business' },
    { value: 'B2G', label: 'B2G - Business to Government' },
] as const

export const TICKET_TYPES = [
    { value: 'Repair', label: 'Repair' },
    { value: 'Preventive Maintenance', label: 'Preventive Maintenance' },
    { value: 'Installation', label: 'Installation' },
    { value: 'Inspection', label: 'Inspection' },
    { value: 'Product Demo', label: 'Product Demo' },
] as const

export type CustomerType = typeof CUSTOMER_TYPES[number]['value']
export type TicketType = typeof TICKET_TYPES[number]['value']