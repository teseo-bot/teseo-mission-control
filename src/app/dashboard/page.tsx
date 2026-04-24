export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <p className="text-sm font-medium leading-none text-muted-foreground">Total Revenue</p>
          <h3 className="mt-2 text-2xl font-bold">$45,231.89</h3>
        </div>
      </div>
    </div>
  )
}
