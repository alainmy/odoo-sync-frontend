import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings as SettingsIcon, Save } from 'lucide-react'

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure WooCommerce and Odoo connections
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              WooCommerce Configuration
            </CardTitle>
            <CardDescription>
              Configure your WooCommerce store connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wc-url">Store URL</Label>
              <Input
                id="wc-url"
                placeholder="https://yourstore.com"
                defaultValue="http://localhost:8000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wc-key">Consumer Key</Label>
              <Input
                id="wc-key"
                type="password"
                placeholder="ck_..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wc-secret">Consumer Secret</Label>
              <Input
                id="wc-secret"
                type="password"
                placeholder="cs_..."
              />
            </div>
            <Button className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Save WooCommerce Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Odoo Configuration
            </CardTitle>
            <CardDescription>
              Configure your Odoo instance connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="odoo-url">Odoo URL</Label>
              <Input
                id="odoo-url"
                placeholder="https://yourinstance.odoo.com"
                defaultValue="http://localhost:8069"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odoo-db">Database</Label>
              <Input
                id="odoo-db"
                placeholder="database_name"
                defaultValue="c4e"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odoo-user">Username</Label>
              <Input
                id="odoo-user"
                placeholder="admin"
                defaultValue="admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odoo-pass">Password</Label>
              <Input
                id="odoo-pass"
                type="password"
                placeholder="••••••••"
              />
            </div>
            <Button className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Save Odoo Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Synchronization Settings</CardTitle>
          <CardDescription>
            Configure automatic synchronization intervals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sync-products">Product Sync (minutes)</Label>
              <Input
                id="sync-products"
                type="number"
                placeholder="15"
                defaultValue="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sync-stock">Stock Sync (minutes)</Label>
              <Input
                id="sync-stock"
                type="number"
                placeholder="30"
                defaultValue="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-cleanup">Webhook Cleanup (days)</Label>
              <Input
                id="webhook-cleanup"
                type="number"
                placeholder="30"
                defaultValue="30"
              />
            </div>
          </div>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Sync Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
