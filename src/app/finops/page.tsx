import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinOpsPage() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">FinOps Dashboard</h1>
        <p className="text-muted-foreground">Mock analytics for token usage and cloud spending across tenants.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total API Spend (This Month)</CardDescription>
            <CardTitle className="text-4xl">$1,245.00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tokens Processed</CardDescription>
            <CardTitle className="text-4xl">45.2M</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Across 3 models</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Tenants</CardDescription>
            <CardTitle className="text-4xl">12</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">3 onboarded this week</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage by Tenant</CardTitle>
          <CardDescription>Simulated token consumption breakdown.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center border border-dashed rounded-md bg-muted/20">
            <p className="text-muted-foreground font-medium">Chart visualization placeholder (e.g. Recharts)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}