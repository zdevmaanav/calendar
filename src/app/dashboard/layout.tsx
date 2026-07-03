import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-theme min-h-screen bg-white">
      <Sidebar />
      <div className="lg:ml-[240px]">
        <Header />
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
