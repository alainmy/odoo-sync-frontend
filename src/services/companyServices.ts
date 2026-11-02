import api from '@/lib/api'


export const fetchOdooCompanies = async (odoo_config: any) => {
  const response = await api.post('/odoo/companies', odoo_config);
  return response.data
}