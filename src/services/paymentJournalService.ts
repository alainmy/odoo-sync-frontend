import api from '@/lib/api'

export const fetchOdooJournals = async (type: string | null = null) => {
  var uri = '/odoo/journals';
   if (type) {
    const response = await api.get(`${uri}?type=${type}`);
    console.log(response.data);
    return response.data;
    }
    else {
      const response = await api.get(uri);
      return response.data;
    }
}

export const fetchWooCommercePaymentMethods = async () => {
  const response = await api.get('/woocommerce/woocommerce/payment-methods')
  return response.data
}

export const fetchPaymentJournalMappings = async (params = {}) => {
  const response = await api.get('/api/v1/sync-management/payment-journals', { params })
  return response.data
}

export const createPaymentJournalMapping = async (mappingData: any) => {
  const response = await api.post('/api/v1/sync-management/payment-journals', mappingData)
  return response.data
}

export const deletePaymentJournalMapping = async (journalId: number) => {
  const response = await api.delete(`/api/v1/sync-management/payment-journals/${journalId}`)
  return response.data
}