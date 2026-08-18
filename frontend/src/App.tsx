import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AdminSidebar, RequireRole } from './components/organisms'
import { AdminLayout } from './components/templates'
import { ROUTE_PATH, USER_ROLE } from './constants'
import {
  ContractsPage,
  DashboardPage,
  HomePage,
  InvoicesPage,
  LeadsPage,
  LoginPage,
  MetersPage,
  NotFoundPage,
  RegisterPage,
  RoomsPage,
  ServicesPage,
  TenantPage,
  UsersPage,
  VerifyEmailPage,
} from './pages'

const STAFF_ROLES = [USER_ROLE.admin, USER_ROLE.manager] as const
const ADMIN_ONLY = [USER_ROLE.admin] as const
const TENANT_ONLY = [USER_ROLE.tenant] as const

/** Wraps a CMS page in the shell and the staff guard, which every one needs. */
function adminRoute(element: React.ReactNode, roles: readonly string[] = STAFF_ROLES) {
  return (
    <RequireRole roles={roles}>
      <AdminLayout sidebar={<AdminSidebar />}>{element}</AdminLayout>
    </RequireRole>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTE_PATH.home} element={<HomePage />} />
        <Route path={ROUTE_PATH.login} element={<LoginPage />} />
        <Route path={ROUTE_PATH.register} element={<RegisterPage />} />
        <Route path={ROUTE_PATH.verifyEmail} element={<VerifyEmailPage />} />

        <Route path={ROUTE_PATH.admin} element={adminRoute(<DashboardPage />)} />
        <Route path={ROUTE_PATH.adminRooms} element={adminRoute(<RoomsPage />)} />
        <Route path={ROUTE_PATH.adminContracts} element={adminRoute(<ContractsPage />)} />
        <Route path={ROUTE_PATH.adminMeters} element={adminRoute(<MetersPage />)} />
        <Route path={ROUTE_PATH.adminInvoices} element={adminRoute(<InvoicesPage />)} />
        <Route path={ROUTE_PATH.adminServices} element={adminRoute(<ServicesPage />)} />
        <Route path={ROUTE_PATH.adminLeads} element={adminRoute(<LeadsPage />)} />
        <Route
          path={ROUTE_PATH.adminUsers}
          element={adminRoute(<UsersPage />, ADMIN_ONLY)}
        />

        <Route
          path={ROUTE_PATH.tenant}
          element={
            <RequireRole roles={TENANT_ONLY}>
              <TenantPage />
            </RequireRole>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
