import Link from "next/link"
import { LayoutDashboard, Users, CircleDollarSign, BellRing, LogOut } from "lucide-react"
import { logout } from "@/app/login/actions"

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-muted/20 hidden md:flex md:flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="">Mission Control</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-4 gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/tenants"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Users className="h-4 w-4" />
            Tenants
          </Link>
          <Link
            href="/finops"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <CircleDollarSign className="h-4 w-4" />
            FinOps
          </Link>
          <Link
            href="/alerts"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <BellRing className="h-4 w-4" />
            Alerts
          </Link>
        </nav>
      </div>
      <div className="p-4 mt-auto">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  )
}
