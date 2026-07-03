"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  IconInstagram,
  IconFacebook,
  IconYoutube,
} from "@/components/icons";
import { CalendarDrawer, CalendarItem } from "@/components/calendar-drawer";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CONTENT_TYPE_COLORS: Record<string, string> = {
  educational: "bg-blue-100 text-blue-700",
  promotional: "bg-emerald-100 text-emerald-700",
  motivational: "bg-[rgba(79,70,229,0.08)] text-[#4F46E5]",
  "behind-the-scenes": "bg-amber-100 text-amber-700",
  festive: "bg-rose-100 text-rose-700",
  trending: "bg-cyan-100 text-cyan-700",
  product: "bg-indigo-100 text-indigo-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-emerald-400",
};

function PlatformIcon({ platform, className = "w-3.5 h-3.5" }: { platform: string; className?: string }) {
  switch (platform) {
    case "instagram":
      return <IconInstagram className={className} />;
    case "facebook":
      return <IconFacebook className={className} />;
    case "youtube":
      return <IconYoutube className={className} />;
    default:
      return (
        <div className={`${className} flex items-center gap-0.5`}>
          <IconInstagram className="w-2.5 h-2.5" />
          <IconFacebook className="w-2.5 h-2.5" />
        </div>
      );
  }
}

export default function CalendarPage() {
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [orgId, setOrgId] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isNewPost, setIsNewPost] = useState(false);
  const [newPostDate, setNewPostDate] = useState<string>("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchCalendarItems = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!org) return;
    setOrgId(org.id);

    const startDate = new Date(year, month, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

    const { data } = await supabase
      .from("content_calendar")
      .select("*")
      .eq("org_id", org.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    setCalendarItems(data || []);
    setLoading(false);
  }, [supabase, year, month]);

  useEffect(() => {
    fetchCalendarItems();
  }, [fetchCalendarItems]);

  const handleGenerateCalendar = async () => {
    if (!orgId) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/generate-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          year,
          month: month + 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCalendarItems(data.calendar);
      toast.success(`Calendar generated! ${data.count} posts scheduled.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate calendar");
    } finally {
      setGenerating(false);
    }
  };

  const navigateMonth = (delta: number) => {
    setLoading(true);
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  const calendarGrid = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDayOfMonth + 1;
    const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dateStr = isCurrentMonth
      ? `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
      : null;
    const dayItems = dateStr
      ? calendarItems.filter((item) => item.date === dateStr)
      : [];

    calendarGrid.push({ dayNum, isCurrentMonth, dateStr, items: dayItems });
  }

  const handleItemClick = (calItem: CalendarItem) => {
    setSelectedItem(calItem);
    setIsNewPost(false);
    setDrawerOpen(true);
  };

  const handleEmptyDayClick = (dateStr: string) => {
    setSelectedItem(null);
    setIsNewPost(true);
    setNewPostDate(dateStr);
    setDrawerOpen(true);
  };

  const handleItemUpdate = (updatedItem: CalendarItem) => {
    setCalendarItems((prev) => {
      const exists = prev.find((i) => i.id === updatedItem.id);
      if (exists) {
        return prev.map((i) => (i.id === updatedItem.id ? updatedItem : i));
      }
      return [...prev, updatedItem];
    });
    setSelectedItem(updatedItem);
  };

  const handleItemDelete = (id: string) => {
    setCalendarItems((prev) => prev.filter((i) => i.id !== id));
  };

  const isToday = (dateStr: string | null) => {
    if (!dateStr) return false;
    return dateStr === new Date().toISOString().split("T")[0];
  };

  const hasCalendarItems = calendarItems.length > 0;

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1200px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        <Skeleton className="h-[600px] rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1200px]"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0A0A0A] tracking-tight">
            Content Calendar
          </h1>
          <p className="text-sm text-[#0A0A0A]/50 mt-0.5">
            Plan and manage your social media content
          </p>
        </div>
        <Button
          onClick={handleGenerateCalendar}
          disabled={generating}
          className="rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-5"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : hasCalendarItems ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Calendar
            </>
          )}
        </Button>
      </motion.div>

      {/* Month Navigation */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-6">
            {/* Month Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 rounded-xl hover:bg-[#F5F5F3] transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-[#0A0A0A]/70" />
              </button>
              <h2 className="font-display text-xl font-semibold text-[#0A0A0A]">
                {monthName} {year}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 rounded-xl hover:bg-[#F5F5F3] transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-[#0A0A0A]/70" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="text-center text-[11px] font-semibold uppercase tracking-wider text-[#0A0A0A]/50 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
              {calendarGrid.map((cell, idx) => (
                <div
                  key={idx}
                  className={`min-h-[110px] p-2 transition-colors ${
                    cell.isCurrentMonth
                      ? "bg-white hover:bg-[#FAFAFA] cursor-pointer"
                      : "bg-[#F9F9F9]"
                  } ${isToday(cell.dateStr) ? "ring-2 ring-[#4F46E5] ring-inset" : ""}`}
                  onClick={() => {
                    if (cell.isCurrentMonth && cell.dateStr && cell.items.length === 0) {
                      handleEmptyDayClick(cell.dateStr);
                    }
                  }}
                >
                  {cell.isCurrentMonth && (
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-medium ${
                            isToday(cell.dateStr)
                              ? "w-6 h-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center"
                              : "text-[#0A0A0A]/70"
                          }`}
                        >
                          {cell.dayNum}
                        </span>
                        {cell.items.length === 0 && cell.dateStr && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEmptyDayClick(cell.dateStr!);
                            }}
                            className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] transition-colors opacity-0 group-hover:opacity-100"
                            style={{ opacity: 0 }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLElement).style.opacity = "1";
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLElement).style.opacity = "0";
                            }}
                          >
                            <Plus className="w-3 h-3 text-[#4F46E5]" />
                          </button>
                        )}
                      </div>

                      {/* Posts */}
                      <div className="space-y-1">
                        {cell.items.map((post) => (
                          <button
                            key={post.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(post);
                            }}
                            className="w-full text-left p-1.5 rounded-lg hover:bg-[#0A0A0A]/[0.06] transition-all group/post"
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <PlatformIcon
                                platform={post.platform}
                                className="w-3 h-3 text-[#0A0A0A]/50"
                              />
                              <Badge
                                className={`${
                                  CONTENT_TYPE_COLORS[post.content_type] ||
                                  "bg-gray-100 text-gray-600"
                                } text-[8px] px-1 py-0 rounded`}
                              >
                                {post.content_type}
                              </Badge>
                              <div
                                className={`w-1.5 h-1.5 rounded-full ml-auto ${
                                  PRIORITY_COLORS[post.priority] || "bg-gray-300"
                                }`}
                              />
                            </div>
                            <p className="text-[10px] text-[#0A0A0A]/70 truncate leading-tight">
                              {post.topic}
                            </p>
                            {post.is_edited_by_user && (
                              <span className="text-[8px] text-amber-500 font-medium">
                                edited
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)]">
              <span className="text-[10px] text-[#0A0A0A]/50 font-medium">Content Types:</span>
              {Object.entries(CONTENT_TYPE_COLORS).map(([type, color]) => (
                <Badge
                  key={type}
                  className={`${color} text-[8px] px-1.5 py-0 rounded capitalize`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar Drawer */}
      <CalendarDrawer
        item={selectedItem}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdate={handleItemUpdate}
        onDelete={handleItemDelete}
        isNew={isNewPost}
        defaultDate={newPostDate}
        orgId={orgId}
      />
    </motion.div>
  );
}
