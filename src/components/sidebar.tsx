"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Building2,
  Settings,
  Smartphone,
  Calendar,
  CheckSquare,
  TrendingUp,
  Bot,
  FolderOpen,
  Menu,
  X,
  Sparkles,
  PenTool,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems: NavItem[] = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <BarChart3 className="w-[18px] h-[18px]" />,
      active: pathname === "/dashboard",
    },
    {
      label: "Brand Profile",
      href: "/dashboard/brand-profile",
      icon: <Building2 className="w-[18px] h-[18px]" />,
      active: pathname === "/dashboard/brand-profile",
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="w-[18px] h-[18px]" />,
      active: pathname === "/dashboard/settings",
    },
  ];

  const phase2Items: NavItem[] = [
    {
      label: "Asset Library",
      href: "/dashboard/assets",
      icon: <FolderOpen className="w-[18px] h-[18px]" />,
      active: pathname === "/dashboard/assets",
    },
    {
      label: "Content Calendar",
      href: "/dashboard/calendar",
      icon: <Calendar className="w-[18px] h-[18px]" />,
      active: pathname === "/dashboard/calendar",
    },
    {
      label: "AI Suggestions",
      href: "/dashboard/suggestions",
      icon: <Bot className="w-[18px] h-[18px]" />,
      active: pathname === "/dashboard/suggestions",
    },
    {
      label: "Caption & Image",
      href: "/dashboard/caption-image",
      icon: <PenTool className="w-[18px] h-[18px]" />,
      active: pathname.startsWith("/dashboard/caption-image"),
    },
    {
      label: "Approval Queue",
      href: "/dashboard/approval",
      icon: <CheckSquare className="w-[18px] h-[18px]" />,
      active: pathname === "/dashboard/approval",
    },
    {
      label: "Social Dashboard",
      href: "/dashboard/social",
      icon: <Smartphone className="w-[18px] h-[18px]" />,
      active: pathname === "/dashboard/social",
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: <TrendingUp className="w-[18px] h-[18px]" />,
      active: pathname === "/dashboard/analytics",
    },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold text-[#0A0A0A] tracking-[-0.01em]">
          Apex Marketing
        </span>
      </div>

      {/* Menu Items */}
      <div className="px-3 mt-2">
        <p className="px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[#0A0A0A]/40 mb-2">
          Menu
        </p>
        <nav className="space-y-0.5">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                item.active
                  ? "bg-[#de662f]/[0.06] text-[#0A0A0A] border-l-2 border-[#de662f] -ml-[2px] pl-[14px]"
                  : "text-[#0A0A0A]/60 hover:bg-[#0A0A0A]/[0.03] hover:text-[#0A0A0A]"
              }`}
            >
              <span
                className={
                  item.active ? "text-[#de662f]" : "text-[#0A0A0A]/40"
                }
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Phase 2 Items */}
      <div className="px-3 mt-6">
        <p className="px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[#0A0A0A]/40 mb-2">
          Content & Analytics
        </p>
        <nav className="space-y-0.5">
          {phase2Items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                item.active
                  ? "bg-[#de662f]/[0.06] text-[#0A0A0A] border-l-2 border-[#de662f] -ml-[2px] pl-[14px]"
                  : "text-[#0A0A0A]/60 hover:bg-[#0A0A0A]/[0.03] hover:text-[#0A0A0A]"
              }`}
            >
              <span
                className={
                  item.active ? "text-[#de662f]" : "text-[#0A0A0A]/40"
                }
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom branding */}
      <div className="mt-auto px-4 py-4">
        <div className="p-4 rounded-xl bg-[#0A0A0A]/[0.03] border border-[#0A0A0A]/[0.04]">
          <p className="text-[11px] font-semibold text-[#0A0A0A] mb-1">
            AI-Powered Platform
          </p>
          <p className="text-[11px] text-[#0A0A0A]/50 leading-relaxed">
            Generate, schedule, and automate your marketing.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white/80 backdrop-blur-md shadow-card flex items-center justify-center"
        aria-label="Toggle menu"
      >
        {mobileOpen ? (
          <X className="w-5 h-5 text-[#0A0A0A]" />
        ) : (
          <Menu className="w-5 h-5 text-[#0A0A0A]" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] h-screen fixed left-0 top-0 z-40 overflow-y-auto bg-white/85 backdrop-blur-xl border-r border-[rgba(0,0,0,0.06)]">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="lg:hidden fixed left-0 top-0 w-[280px] h-screen bg-white/95 backdrop-blur-xl z-50 shadow-ambient overflow-y-auto"
            >
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
