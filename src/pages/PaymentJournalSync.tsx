import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, XCircle, RefreshCw, Loader, Plus, AlertCircle, Trash2 } from 'lucide-react'
import { fetchOdooJournals, fetchWooCommercePaymentMethods, fetchPaymentJournalMappings, createPaymentJournalMapping, deletePaymentJournalMapping } from '@/services/paymentJournalService'

interface PaymentJournalMapping {
  id: number
  woocommerce_payment_method_id: string
  woocommerce_payment_method_name: string | null
  odoo_journal_id: number
  odoo_journal_name: string | null
  odoo_journal_type: string | null
  odoo_journal_code: string | null
  created: boolean
  updated: boolean
  skipped: boolean
  error: boolean
  message: string
  error_details: string | null
  last_synced_at: string | null
}

interface FormData {
  woocommerce_payment_method_id: string
  woocommerce_payment_method_name: string
  odoo_journal_id: number
  odoo_journal_name: string
  odoo_journal_type: string
  odoo_journal_code: string
}

interface OdooJournal {
  id: number
  name: string
  type: string
  code: string
}

interface WooCommercePaymentMethod {
  id: string
  title: string
}


export default function PaymentJournalSync() {
  const [filter, setFilter] = useState<'all' | 'errors'>('all')
  const [selectedWcMethodId, setSelectedWcMethodId] = useState<string>('')
  const [selectedOdooJournalId, setSelectedOdooJournalId] = useState<string>('')

  const emptyForm: FormData = {
    woocommerce_payment_method_id: '',
    woocommerce_payment_method_name: '',
    odoo_journal_id: 0,
    odoo_journal_name: '',
    odoo_journal_type: '',
    odoo_journal_code: ''
  }
  const [formData, setFormData] = useState<FormData>(emptyForm)

  const queryClient = useQueryClient()

  const { data: paymentJournals, isLoading, refetch } = useQuery<PaymentJournalMapping[]>({
    queryKey: ['payment-journals-sync', filter],
    queryFn: async () => {
      const params = filter === 'errors' ? { has_error: true } : {}
      const response = await fetchPaymentJournalMappings(params)
      return response.data ?? []
    },
  })

  const { data: wcMethods, isLoading: wcMethodsLoading } = useQuery<WooCommercePaymentMethod[]>({
    queryKey: ['woocommerce-payment-methods'],
    queryFn: async () => {
      const response = await fetchWooCommercePaymentMethods()
      return response.payment_gateways ?? []
    },
  })

  const { data: odooJournals, isLoading: journalsLoading } = useQuery<OdooJournal[]>({
    queryKey: ['odoo-journals'],
    queryFn: async () => {
      const response = await fetchOdooJournals()
      return response.payment_journals ?? []
    },
  })

  const mutation = useMutation({
    mutationFn: async (fd: FormData) => {
      const response = await createPaymentJournalMapping(fd)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-journals-sync'] })
      setFormData(emptyForm)
      setSelectedWcMethodId('')
      setSelectedOdooJournalId('')
    },
    onError: (error) => {
      console.error('Error creating payment journal mapping:', error)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (journalId: number) => {
      const response = await deletePaymentJournalMapping(journalId)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-journals-sync'] })
      refetch();
    },
    onError: (error) => {
      console.error('Error deleting payment journal mapping:', error)
    }
  })

  const handleWcMethodChange = (value: string) => {
    setSelectedWcMethodId(value)
    const selectedMethod = (wcMethods ?? []).find(m => m.id === value)
    setFormData(prev => ({
      ...prev,
      woocommerce_payment_method_id: value,
      woocommerce_payment_method_name: selectedMethod?.title ?? ''
    }))
    console.log(`${formData}`);
  }

  const handleOdooJournalChange = (value: string) => {
    setSelectedOdooJournalId(value)
    const journalId = parseInt(value)
    const selectedJournal = (odooJournals ?? []).find(j => j.id === journalId)
    setFormData(prev => ({
      ...prev,
      odoo_journal_id: journalId,
      odoo_journal_name: selectedJournal?.name ?? '',
      odoo_journal_type: selectedJournal?.type ?? '',
      odoo_journal_code: selectedJournal?.code ?? ''
    }))
    console.log(`${formData}`);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.woocommerce_payment_method_id !== '' && formData.odoo_journal_id > 0) {
      mutation.mutate(formData)
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return 'Never'
    return new Date(d).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Method - Journal Synchronization</h1>
          <p className="text-muted-foreground mt-2">
            Map WooCommerce payment methods to Odoo accounting journals
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
          All Mappings
        </Button>
        <Button variant={filter === 'errors' ? 'default' : 'outline'} onClick={() => setFilter('errors')}>
          Errors Only
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create New Mapping</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Select a WooCommerce payment method and map it to an Odoo journal
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium">WooCommerce Payment Method</label>
                <Select value={selectedWcMethodId} onValueChange={handleWcMethodChange} disabled={wcMethodsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={wcMethodsLoading ? 'Loading...' : 'Select a payment method'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(wcMethods ?? []).map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Odoo Journal</label>
                <Select value={selectedOdooJournalId} onValueChange={handleOdooJournalChange} disabled={journalsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={journalsLoading ? 'Loading...' : 'Select a journal'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(odooJournals ?? []).map(journal => (
                      <SelectItem key={journal.id} value={journal.id.toString()}>
                        [{journal.code}] {journal.name} ({journal.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={mutation.isPending || formData.woocommerce_payment_method_id === '' || formData.odoo_journal_id === 0}
                className="w-48"
              >
                {mutation.isPending ? (
                  <>
                    <Loader className="mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Mapping
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading payment journal mappings...
            </CardContent>
          </Card>
        ) : paymentJournals && paymentJournals.length > 0 ? (
          paymentJournals.map((mapping) => (
            <Card key={mapping.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {mapping.woocommerce_payment_method_name ?? 'Unknown'} &rarr; {mapping.odoo_journal_name ?? 'Unknown'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      WC Method ID: {mapping.woocommerce_payment_method_id} | Odoo Journal ID: {mapping.odoo_journal_id}
                    </p>
                    <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
                      <span>Journal Type: {mapping.odoo_journal_type ?? '-'}</span>
                      <span>Journal Code: {mapping.odoo_journal_code ?? '-'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="flex gap-2 flex-wrap">
                      {mapping.created && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Created
                        </Badge>
                      )}
                      {mapping.updated && (
                        <Badge variant="default" className="bg-blue-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Updated
                        </Badge>
                      )}
                      {mapping.skipped && (
                        <Badge variant="secondary">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Skipped
                        </Badge>
                      )}
                      {mapping.error && (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Error
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(mapping.id)}
                      disabled={deleteMutation.isPending}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{mapping.message}</p>
                {mapping.last_synced_at && (
                  <p className="text-xs text-muted-foreground mt-2">Last synced: {formatDate(mapping.last_synced_at)}</p>
                )}
                {mapping.error_details && (
                  <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive font-mono">{mapping.error_details}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Loader className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No payment journal mappings configured yet</p>
              <p className="text-sm mt-1">Use the form above to create your first mapping</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}