import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "sonner";
import DashboardLayout from "@/pages/DashboardLayout";
import Overview from "@/pages/Overview";
import Agents from "@/pages/Agents";
import Policies from "@/pages/Policies";
import Runtime from "@/pages/Runtime";
import AuditLogs from "@/pages/AuditLogs";
import Analytics from "@/pages/Analytics";
import Escalations from "@/pages/Escalations";
import Settings from "@/pages/Settings";
import ApiKeys from "@/pages/ApiKeys";
import Connectors from "@/pages/Connectors";
import Webhooks from "@/pages/Webhooks";
import Members from "@/pages/Members";
import Compliance from "@/pages/Compliance";
import SDKs from "@/pages/SDKs";
import Architecture from "@/pages/Architecture";
import Playground from "@/pages/Playground";
import Memory from "@/pages/Memory";
import RiskCopilot from "@/pages/RiskCopilot";
// Public marketing pages
import Home from "@/pages/public/Home";
import Product from "@/pages/public/Product";
import Pricing from "@/pages/public/Pricing";
import Docs from "@/pages/public/Docs";
import Security from "@/pages/public/Security";
import Customers from "@/pages/public/Customers";
import Benchmarks from "@/pages/public/Benchmarks";
import Pilot, { PilotThanks } from "@/pages/public/Pilot";
import PricingSuccess from "@/pages/public/PricingSuccess";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-500 font-mono-plex text-sm">
        loading…
      </div>
    );
  if (!user)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-neutral-500 font-mono-plex text-sm">
        <p>Can't reach the server right now.</p>
        <button onClick={() => window.location.reload()} className="btn-secondary text-sm">
          Retry
        </button>
      </div>
    );
  return children;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f3f4f6",
              },
            }}
          />
          <Routes>
            {/* Public marketing site */}
            <Route path="/" element={<Home />} />
            <Route path="/product" element={<Product />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/pricing/success" element={<PricingSuccess />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/security" element={<Security />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/benchmarks" element={<Benchmarks />} />
            <Route path="/pilot" element={<Pilot />} />
            <Route path="/pilot/thanks" element={<PilotThanks />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/risk-copilot" element={<RiskCopilot />} />

            {/* Legacy link target — the product no longer requires signing in */}
            <Route path="/auth" element={<Navigate to="/console" replace />} />

            {/* Dashboard (protected) */}
            <Route
              path="/console"
              element={
                <Protected>
                  <DashboardLayout />
                </Protected>
              }
            >
              <Route index element={<Overview />} />
              <Route path="agents" element={<Agents />} />
              <Route path="policies" element={<Policies />} />
              <Route path="runtime" element={<Runtime />} />
              <Route path="memory" element={<Memory />} />
              <Route path="risk-copilot" element={<RiskCopilot />} />
              <Route path="audit" element={<AuditLogs />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="escalations" element={<Escalations />} />
              <Route path="keys" element={<ApiKeys />} />
              <Route path="connectors" element={<Connectors />} />
              <Route path="webhooks" element={<Webhooks />} />
              <Route path="members" element={<Members />} />
              <Route path="compliance" element={<Compliance />} />
              <Route path="sdks" element={<SDKs />} />
              <Route path="architecture" element={<Architecture />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
