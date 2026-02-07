import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { InstanceSelector } from '@/components/InstanceSelector'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Webhook,
  ListChecks,
  Settings,
  LogOut,
  ShoppingCart,
  Database,
  Moon,
  Sun,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Tags,
  Server,
  Sliders,
  DollarSign,
} from 'lucide-react'
import { useState } from 'react'

interface MenuItem {
  icon: any
  label: string
  path?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  {
    icon: RefreshCw,
    label: 'Synchronization',
    children: [
      { icon: Package, label: 'Products', path: '/products' },
      { icon: FolderTree, label: 'Categories', path: '/categories' },
      { icon: Tags, label: 'Tags', path: '/tags' },
      { icon: Sliders, label: 'Attributes', path: '/attributes' },
      { icon: DollarSign, label: 'Price Lists', path: '/pricelists' },
    ],
  },
  {
    icon: Database,
    label: 'Odoo',
    children: [
      { icon: Package, label: 'Products', path: '/odoo-products' },
      { icon: FolderTree, label: 'Categories', path: '/odoo-categories' },
      { icon: Tags, label: 'Tags', path: '/odoo-tags' },
      { icon: Sliders, label: 'Attributes', path: '/odoo-attributes' },
    ],
  },
  {
    icon: Webhook,
    label: 'Webhooks',
    children: [
      { icon: Webhook, label: 'Management', path: '/webhooks-management' },
      { icon: Webhook, label: 'Logs', path: '/webhooks' },
    ],
  },
  { icon: ListChecks, label: 'Tasks', path: '/tasks' },
  { icon: Server, label: 'Instances', path: '/instances' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

function MenuItem({ item, isActive }: { item: MenuItem; isActive: (path: string) => boolean }) {
  const [isOpen, setIsOpen] = useState(true)

  if (item.children) {
    return (
      <div>
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center">
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children.map((child) => (
              <MenuItem key={child.path || child.label} item={child} isActive={isActive} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const Icon = item.icon
  return (
    <Link to={item.path!}>
      <Button
        variant={isActive(item.path!) ? 'secondary' : 'ghost'}
        className="w-full justify-start"
      >
        <Icon className="mr-2 h-4 w-4" />
        {item.label}
      </Button>
    </Link>
  )
}

export default function DashboardLayout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">×</span>
            <Database className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">WC-Odoo Sync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.name || user?.email}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <MenuItem key={item.path || item.label} item={item} isActive={isActive} />
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex items-center gap-2 cursor-pointer">
              {theme === 'light' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="text-sm">Dark Mode</span>
            </Label>
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background overflow-auto">
        <div className="border-b border-border bg-card p-4">
          <div className="container mx-auto flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Instance</h2>
            <InstanceSelector />
          </div>
        </div>
        <div className="container mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
