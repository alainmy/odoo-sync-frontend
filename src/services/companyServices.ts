import api from '@/lib/api'


export const fetchOdooCompanies = async () => {
  const response = await api.get('/odoo/companies')
  return response.data
}