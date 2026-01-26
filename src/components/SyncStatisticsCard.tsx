import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface SyncStatistics {
  total_products: number;
  never_synced: number;
  synced: number;
  modified: number;
  errors: number;
  last_sync: string | null;
}

export default function SyncStatisticsCard() {
  const { data, isLoading } = useQuery<SyncStatistics>({
    queryKey: ['odoo-sync-statistics'],
    queryFn: async () => {
      const response = await api.get('/api/v1/sync-management/statistics');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: 'Total Products',
      value: data.total_products,
      icon: Clock,
      color: 'text-blue-500',
    },
    {
      label: 'Synced',
      value: data.synced,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
    {
      label: 'Never Synced',
      value: data.never_synced,
      icon: AlertCircle,
      color: 'text-yellow-500',
    },
    {
      label: 'Errors',
      value: data.errors,
      icon: XCircle,
      color: 'text-red-500',
    },
  ];

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sync Statistics</span>
          <Badge variant="outline" className="font-normal">
            Last sync: {formatLastSync(data.last_sync)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex flex-col">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-xs">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
