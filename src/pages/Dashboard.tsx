import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SyncStatisticsCard from '@/components/SyncStatisticsCard'
import ActiveTasksCard from '@/components/ActiveTasksCard'
import QueueStatsCard from '@/components/QueueStatsCard'
import TaskStatsCard from '@/components/TaskStatsCard'
import {
  Package,
  FolderTree,
  Webhook,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface SyncStats {
  webhooks: {
    total: number
    by_status: Record<string, number>
  }
  tasks: {
    total: number
    by_status: Record<string, number>
  }
  products: {
    total: number
    created: number
    updated: number
    errors: number
  }
  categories: {
    total: number
    created: number
    updated: number
    errors: number
  }
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<SyncStats>({
    queryKey: ['dashboard-sync-statistics'],
    queryFn: async () => {
      const response = await api.get('/api/v1/sync/statistics')
      return response.data
    },
    refetchInterval: 30000, // Refresh every 30s
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse bg-muted h-20" />
              <CardContent className="animate-pulse bg-muted h-24 mt-4" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Products Synced',
      value: stats?.products.total || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      details: `${stats?.products.created || 0} created, ${stats?.products.updated || 0} updated`,
    },
    {
      title: 'Categories Synced',
      value: stats?.categories.total || 0,
      icon: FolderTree,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
      details: `${stats?.categories.created || 0} created, ${stats?.categories.updated || 0} updated`,
    },
    {
      title: 'Webhooks Processed',
      value: stats?.webhooks.total || 0,
      icon: Webhook,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      details: `${stats?.webhooks.by_status?.completed || 0} completed`,
    },
    {
      title: 'Tasks Executed',
      value: stats?.tasks.total || 0,
      icon: CheckCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      details: `${stats?.tasks.by_status?.success || 0} successful`,
    },
  ]

  const syncData = [
    {
      name: 'Products',
      Created: stats?.products.created || 0,
      Updated: stats?.products.updated || 0,
      Errors: stats?.products.errors || 0,
    },
    {
      name: 'Categories',
      Created: stats?.categories.created || 0,
      Updated: stats?.categories.updated || 0,
      Errors: stats?.categories.errors || 0,
    },
  ]

  const taskStatusData = [
    { name: 'Success', value: stats?.tasks.by_status?.success || 0 },
    { name: 'Pending', value: stats?.tasks.by_status?.pending || 0 },
    { name: 'Retry', value: stats?.tasks.by_status?.retry || 0 },
    { name: 'Failed', value: stats?.tasks.by_status?.failure || 0 },
  ]

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of WooCommerce-Odoo synchronization status
        </p>
      </div>

      {/* Sync Statistics Card */}
      <SyncStatisticsCard />

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.details}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sync Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={syncData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Created" fill="#10b981" />
                <Bar dataKey="Updated" fill="#3b82f6" />
                <Bar dataKey="Errors" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Task Tracking Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TaskStatsCard />
        <ActiveTasksCard />
        <QueueStatsCard />
      </div>

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sync Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Successful</span>
              </div>
              <span className="font-bold text-green-600">
                {(stats?.tasks.by_status?.success || 0) +
                  (stats?.webhooks.by_status?.completed || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm">Failed</span>
              </div>
              <span className="font-bold text-red-600">
                {(stats?.tasks.by_status?.failure || 0) +
                  (stats?.webhooks.by_status?.failed || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="text-sm">Pending</span>
              </div>
              <span className="font-bold text-yellow-600">
                {(stats?.tasks.by_status?.pending || 0) +
                  (stats?.webhooks.by_status?.pending || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Product synchronization</p>
                <p className="text-xs text-muted-foreground">Running smoothly</p>
              </div>
              <span className="text-xs text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center gap-3">
              <Webhook className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Webhook processing</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.webhooks.by_status?.pending || 0} in queue
                </p>
              </div>
              <span className="text-xs text-blue-600 font-medium">
                {stats?.webhooks.by_status?.pending || 0} pending
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
