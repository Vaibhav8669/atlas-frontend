import { useState, useEffect } from 'react'
import { Navbar } from '@/components/common/navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CasesPage } from '@/components/cases/CasesPage'
import { SdrPage } from '@/components/sdr/SdrPage'
import { UsersPage } from '@/components/users/UsersPage'

export default function Dashboard() {
    // Get saved tab from localStorage or default to 'cases'
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('lastActiveTab') || 'cases'
    })

    // Save to localStorage when tab changes
    useEffect(() => {
        localStorage.setItem('lastActiveTab', activeTab)
    }, [activeTab])

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto py-5">
                <div className="w-full h-full">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="mb-2 bg-grey gap-3 p-0">
                            <TabsTrigger value="cases" className="bg-secondary px-6 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                Cases
                            </TabsTrigger>
                            <TabsTrigger value="sdr" className="bg-secondary px-6 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                SDR Master
                            </TabsTrigger>
                            <TabsTrigger value="users" className="bg-secondary px-6 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                Users
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="cases">
                            <CasesPage />
                        </TabsContent>

                        <TabsContent value="sdr">
                            <SdrPage />
                        </TabsContent>

                        <TabsContent value="users">
                            <UsersPage />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    )
}