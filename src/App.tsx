import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { Toaster } from './components/ui/toaster'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import ProductsSync from './pages/ProductsSync'
import CategoriesSync from './pages/CategoriesSync'
import TagsSync from './pages/TagsSync'
import AttributesSync from './pages/AttributesSync'
import WebhookLogs from './pages/WebhookLogs'
import TaskLogs from './pages/TaskLogs'
import Settings from './pages/Settings'
import Instances from './pages/Instances'
import OdooProductsSync from './pages/OdooProductsSync'
import OdooCategoriesSync from './pages/OdooCategoriesSync'
import OdooTagsSync from './pages/OdooTagsSync'
import OdooAttributes from './pages/OdooAttributes'
import PricelistsSync from './pages/PricelistsSync'
import WebhooksManagement from './pages/WebhooksManagement'
import './App.css'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductsSync />} />
          <Route path="odoo-products" element={<OdooProductsSync />} />
          <Route path="odoo-categories" element={<OdooCategoriesSync />} />
          <Route path="odoo-tags" element={<OdooTagsSync />} />
          <Route path="odoo-attributes" element={<OdooAttributes />} />
          <Route path="categories" element={<CategoriesSync />} />
          <Route path="tags" element={<TagsSync />} />
          <Route path="attributes" element={<AttributesSync />} />
          <Route path="pricelists" element={<PricelistsSync />} />
          <Route path="webhooks-management" element={<WebhooksManagement />} />
          <Route path="webhooks" element={<WebhookLogs />} />
          <Route path="tasks" element={<TaskLogs />} />
          <Route path="instances" element={<Instances />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
