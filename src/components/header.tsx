"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, User } from "lucide-react";

interface Organization {
  name: string;
  logo_url: string | null;
}

export function Header() {
  const [orgName, setOrgName] = useState("Apex Marketing");
  const [userName, setUserName] = useState("");
  const [userInitials, setUserInitials] = useState("U");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const fullName =
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        setUserName(fullName);
        setUserInitials(
          fullName
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        );

        // Fetch organization
        const { data: org } = await supabase
          .from("organizations")
          .select("name, logo_url")
          .eq("user_id", user.id)
          .single<Organization>();

        if (org) {
          setOrgName(org.name);
        }
      }
    }

    fetchData();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-[rgba(0,0,0,0.06)] sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8">
      <div className="flex items-center gap-3 lg:ml-0 ml-12">
        <h2 className="text-[15px] font-semibold text-[#0A0A0A] tracking-[-0.01em]">
          {orgName}
        </h2>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <button className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-[#0A0A0A]/[0.03] transition-colors">
            <span className="text-[13px] text-[#0A0A0A]/60 font-medium hidden sm:block">
              {userName}
            </span>
            <Avatar className="w-8 h-8 bg-[#0A0A0A]">
              <AvatarFallback className="text-white text-xs font-semibold bg-transparent">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 rounded-xl shadow-ambient border-[rgba(0,0,0,0.08)]"
        >
          <DropdownMenuItem className="gap-2 rounded-lg text-[13px]">
            <User className="w-4 h-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 rounded-lg text-[13px]"
            onClick={() => router.push("/dashboard/settings")}
          >
            <Settings className="w-4 h-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 rounded-lg text-red-600 text-[13px]"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
