import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts/main-layout";
import { ProtectedRoute } from "@/router/protected-route";
import { RoleRoute } from "@/router/role-route";
import { LoginPage } from "@/pages/login/login-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { JobsPage } from "@/pages/jobs/jobs-page";
import { JobDetailPage } from "@/pages/jobs/job-detail-page";
import { CustomersPage } from "@/pages/customers/customers-page";
import { CustomerDetailPage } from "@/pages/customers/customer-detail-page";
import { TechniciansPage } from "@/pages/technicians/technicians-page";
import { TechnicianDetailPage } from "@/pages/technicians/technician-detail-page";
import { InvoicesPage } from "@/pages/invoices/invoices-page";
import { InvoiceDetailPage } from "@/pages/invoices/invoice-detail-page";
import { CalendarPage } from "@/pages/calendar/calendar-page";
import { SettingsPage } from "@/pages/settings/settings-page";
import { SchedulingPage } from "@/pages/scheduling/scheduling-page";
import { DispatchPage } from "@/pages/dispatch/dispatch-page";
import { TechnicianDashboardPage } from "@/pages/technician/technician-dashboard";
import { TechnicianJobsPage } from "@/pages/technician/technician-jobs";
import { TechnicianJobDetailPage } from "@/pages/technician/technician-job-detail";
import { TechnicianSchedulePage } from "@/pages/technician/technician-schedule";
import { NotFoundPage } from "@/pages/not-found-page";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            element: <RoleRoute allow={["ADMIN", "STAFF"]} redirectTo="/technician" />,
            children: [
              { path: "/", element: <DashboardPage /> },
              { path: "/dashboard", element: <DashboardPage /> },
              { path: "/jobs", element: <JobsPage /> },
              { path: "/jobs/:id", element: <JobDetailPage /> },
              { path: "/customers", element: <CustomersPage /> },
              { path: "/customers/:id", element: <CustomerDetailPage /> },
              { path: "/technicians", element: <TechniciansPage /> },
              { path: "/technicians/:id", element: <TechnicianDetailPage /> },
              { path: "/invoices", element: <InvoicesPage /> },
              { path: "/invoices/:id", element: <InvoiceDetailPage /> },
              { path: "/calendar", element: <CalendarPage /> },
              { path: "/dispatch", element: <DispatchPage /> },
              { path: "/scheduling", element: <SchedulingPage /> },
              { path: "/settings", element: <SettingsPage /> }
            ]
          },
          {
            element: <RoleRoute allow={["TECHNICIAN"]} redirectTo="/dashboard" />,
            children: [
              { path: "/technician", element: <TechnicianDashboardPage /> },
              { path: "/technician/jobs", element: <TechnicianJobsPage /> },
              { path: "/technician/jobs/:id", element: <TechnicianJobDetailPage /> },
              { path: "/technician/schedule", element: <TechnicianSchedulePage /> }
            ]
          }
        ]
      }
    ]
  },
  { path: "*", element: <NotFoundPage /> }
]);

