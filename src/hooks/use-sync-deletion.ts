import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface UseSyncDeletionOptions {
  /** Base API path, e.g. '/api/v1/sync/products' */
  basePath: string
  /** Query keys to invalidate after deletion */
  queryKeys: string[]
}

export function useSyncDeletion({ basePath, queryKeys }: UseSyncDeletionOptions) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }))

  const handleError = (error: any) => {
    toast({
      variant: 'destructive',
      title: 'Delete Failed',
      description: error.response?.data?.detail || 'Failed to delete sync records',
    })
  }

  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 1) {
        const response = await api.delete(`${basePath}/${ids[0]}`)
        return response.data
      }
      const response = await api.post(`${basePath}/bulk-delete`, { ids })
      return response.data
    },
    onSuccess: (data: any) => {
      toast({ title: 'Deleted', description: data.message })
      setSelectedIds([])
      invalidate()
    },
    onError: handleError,
  })

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(basePath)
      return response.data
    },
    onSuccess: (data: any) => {
      toast({ title: 'Deleted', description: data.message })
      setSelectedIds([])
      invalidate()
    },
    onError: handleError,
  })

  const handleDelete = (ids: number[], confirmMessage: string) => {
    if (ids.length === 0) return
    if (!window.confirm(confirmMessage)) return
    deleteMutation.mutate(ids)
  }

  const handleDeleteSelected = (entityLabel: string) => {
    handleDelete(
      selectedIds,
      `Are you sure you want to delete ${selectedIds.length} ${entityLabel} sync record(s)? This only removes the local mapping, not the records in WooCommerce.`
    )
  }

  const handleDeleteAll = (entityLabel: string, instanceName?: string | null) => {
    if (!window.confirm(
      `Are you sure you want to delete ALL ${entityLabel} sync records${instanceName ? ` for instance "${instanceName}"` : ''}? This only removes the local mappings, not the records in WooCommerce.`
    )) return
    deleteAllMutation.mutate()
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = (allIds: number[]) => {
    setSelectedIds(prev =>
      prev.length === allIds.length && allIds.every(id => prev.includes(id)) ? [] : allIds
    )
  }

  return {
    selectedIds,
    setSelectedIds,
    toggleSelect,
    toggleSelectAll,
    handleDeleteSelected,
    handleDeleteAll,
    handleDeleteOne: (id: number, name: string) =>
      handleDelete(
        [id],
        `Are you sure you want to delete the sync record for "${name}"? This only removes the local mapping, not the record in WooCommerce.`
      ),
    isDeleting: deleteMutation.isPending || deleteAllMutation.isPending,
  }
}
