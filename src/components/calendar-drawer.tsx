"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Trash2,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { PipelineProgress } from "@/components/pipeline-progress";

export interface CalendarItem {
  id: string;
  org_id: string;
  date: string;
  platform: string;
  content_type: string;
  topic: string;
  caption_direction: string;
  visual_direction: string;
  occasion: string | null;
  priority: string;
  generated_caption: string | null;
  generated_hashtags: string[];
  generated_image_url: string | null;
  status: string;
  is_edited_by_user: boolean;
  use_assets: boolean;
  scheduled_post_time: string | null;
}

interface CalendarDrawerProps {
  item: CalendarItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (item: CalendarItem) => void;
  onDelete: (id: string) => void;
  isNew?: boolean;
  defaultDate?: string;
  orgId: string;
}

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "all", label: "All Platforms" },
];

const CONTENT_TYPES = [
  { value: "educational", label: "Educational" },
  { value: "promotional", label: "Promotional" },
  { value: "motivational", label: "Motivational" },
  { value: "behind-the-scenes", label: "Behind the Scenes" },
  { value: "festive", label: "Festive" },
  { value: "trending", label: "Trending" },
  { value: "product", label: "Product" },
];

/* ─── Inline style constants ─── */
const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.07em",
  color: "#94A3B8",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 10,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "1px solid #E2E8F0",
  borderRadius: 10,
  backgroundColor: "#F8FAFC",
  fontSize: 14,
  lineHeight: 1.6,
  color: "#1E293B",
  outline: "none",
  transition: "border-color 0.15s, background-color 0.15s",
  fontFamily: "inherit",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  resize: "vertical" as const,
  lineHeight: 1.7,
};

const selectTriggerStyle: React.CSSProperties = {
  height: 46,
  borderRadius: 10,
  border: "1px solid #E2E8F0",
  backgroundColor: "#F8FAFC",
  fontSize: 14,
  color: "#1E293B",
};

const dividerStyle: React.CSSProperties = {
  height: 1,
  backgroundColor: "#F1F5F9",
  border: "none",
  margin: 0,
};

export function CalendarDrawer({
  item,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  isNew = false,
  defaultDate,
  orgId,
}: CalendarDrawerProps) {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState<Partial<CalendarItem>>({});
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const currentItem = { ...item, ...form };

  const handleFieldChange = async (field: string, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value, is_edited_by_user: true }));

    if (!isNew && item?.id) {
      const { error } = await supabase
        .from("content_calendar")
        .update({ [field]: value, is_edited_by_user: true })
        .eq("id", item.id);

      if (error) {
        toast.error("Failed to save changes");
      } else {
        onUpdate({ ...item, ...form, [field]: value, is_edited_by_user: true } as CalendarItem);
      }
    }
  };

  /* ─── Regenerate Post Idea ─── */
  const handleRegenerateIdea = async () => {
    if (!item?.id || isNew) return;
    setRegenerating(true);

    try {
      const res = await fetch("/api/regenerate-post-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: item.id,
          org_id: orgId,
          date: currentItem.date || defaultDate,
          platform: currentItem.platform || "all",
          content_type: currentItem.content_type || "educational",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to regenerate");
      }

      // Update all drawer fields instantly
      const updates: Partial<CalendarItem> = {
        topic: data.topic,
        caption_direction: data.caption_direction,
        visual_direction: data.visual_direction,
        occasion: data.occasion,
        is_edited_by_user: true,
      };

      setForm((prev) => ({ ...prev, ...updates }));
      onUpdate({ ...item, ...updates } as CalendarItem);
      toast.success("Post idea regenerated!");
    } catch (err) {
      console.error("[CalendarDrawer] Regenerate error:", err);
      toast.error("Failed to regenerate. Please try again.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveNew = async () => {
    if (!currentItem.topic) {
      toast.error("Topic is required");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("content_calendar")
      .insert({
        org_id: orgId,
        date: currentItem.date || defaultDate,
        platform: currentItem.platform || "all",
        content_type: currentItem.content_type || "educational",
        topic: currentItem.topic,
        caption_direction: currentItem.caption_direction || "",
        visual_direction: currentItem.visual_direction || "",
        occasion: currentItem.occasion || null,
        priority: currentItem.priority || "medium",
        status: "scheduled",
        is_edited_by_user: false,
        use_assets: false,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast.error("Failed to create post");
    } else if (data) {
      toast.success("Post added to calendar");
      onUpdate(data);
      onOpenChange(false);
      setForm({});
    }
  };

  const handleDelete = async () => {
    if (!item?.id) return;

    const { error } = await supabase
      .from("content_calendar")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to delete post");
    } else {
      toast.success("Post removed from calendar");
      onDelete(item.id);
      onOpenChange(false);
    }
  };

  const handleOpenStudio = () => {
    if (!item?.id) return;
    onOpenChange(false);
    router.push(`/dashboard/caption-image?post=${item.id}`);
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, { text: string; bg: string; color: string }> = {
      scheduled: { text: "Scheduled", bg: "#EFF6FF", color: "#3B82F6" },
      caption_generated: { text: "Caption Ready", bg: "#EFF6FF", color: "#3B82F6" },
      image_generated: { text: "Image Ready", bg: "#F3E8FF", color: "#7C3AED" },
      pending_approval: { text: "Pending Approval", bg: "#FFFBEB", color: "#D97706" },
      approved: { text: "Approved", bg: "#ECFDF5", color: "#059669" },
      posted: { text: "Posted", bg: "#ECFDF5", color: "#16A34A" },
      rejected: { text: "Rejected", bg: "#FEF2F2", color: "#DC2626" },
      post_failed: { text: "Post Failed", bg: "#FEF2F2", color: "#DC2626" },
    };
    return labels[status] || labels.scheduled;
  };

  const status = statusLabel(item?.status || "scheduled");

  /* Focus handler for inputs */
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "#4F46E5";
    e.target.style.backgroundColor = "#FFFFFF";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "#E2E8F0";
    e.target.style.backgroundColor = "#F8FAFC";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-[500px] lg:max-w-[500px] 2xl:max-w-[520px] bg-white border-l border-[#F1F5F9] p-0"
        style={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        {/* ═══════════ FIXED HEADER ═══════════ */}
        <SheetHeader
          className="flex-shrink-0"
          style={{
            padding: "32px 32px 24px 32px",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <div className="flex items-center justify-between">
            <SheetTitle
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.01em",
              }}
            >
              {isNew ? "Add New Post" : "Edit Post"}
            </SheetTitle>
            <div className="flex items-center gap-2.5">
              {item?.is_edited_by_user && (
                <Badge
                  style={{
                    backgroundColor: "#FFFBEB",
                    color: "#D97706",
                    borderRadius: 999,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    border: "none",
                  }}
                >
                  Edited
                </Badge>
              )}
              <Badge
                style={{
                  backgroundColor: status.bg,
                  color: status.color,
                  borderRadius: 999,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  border: "none",
                }}
              >
                {status.text}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        {/* ═══════════ SCROLLABLE CONTENT ═══════════ */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px 32px 16px 32px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Pipeline Progress */}
            {!isNew && item && (
              <>
                <div style={{ padding: "0 0" }}>
                  <PipelineProgress status={item.status} compact />
                </div>
                <hr style={dividerStyle} />
              </>
            )}

            {/* ── Topic ── */}
            <div>
              <label style={labelStyle}>Topic</label>
              <input
                value={currentItem.topic || ""}
                onChange={(e) => handleFieldChange("topic", e.target.value)}
                placeholder="Post topic..."
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />

              {/* ── Regenerate Post Idea Button ── */}
              {!isNew && item && (
                <button
                  onClick={handleRegenerateIdea}
                  disabled={regenerating}
                  style={{
                    width: "100%",
                    height: 36,
                    marginTop: 10,
                    backgroundColor: regenerating ? "#F1F5F9" : "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    color: regenerating ? "#94A3B8" : "#6366F1",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: regenerating ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    transition: "all 0.15s ease",
                    outline: "none",
                    opacity: regenerating ? 0.75 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!regenerating) {
                      e.currentTarget.style.backgroundColor = "#EEF2FF";
                      e.currentTarget.style.borderColor = "#C7D2FE";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!regenerating) {
                      e.currentTarget.style.backgroundColor = "#F8FAFC";
                      e.currentTarget.style.borderColor = "#E2E8F0";
                    }
                  }}
                >
                  <RefreshCw
                    style={{
                      width: 14,
                      height: 14,
                      animation: regenerating ? "spin 1s linear infinite" : "none",
                    }}
                  />
                  {regenerating ? "Regenerating..." : "✨ Regenerate Post Idea"}
                </button>
              )}
            </div>

            {/* ── Platform & Content Type (2-col) ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Platform</label>
                <Select
                  value={currentItem.platform || "all"}
                  onValueChange={(v) => handleFieldChange("platform", v)}
                >
                  <SelectTrigger style={selectTriggerStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label style={labelStyle}>Content Type</label>
                <Select
                  value={currentItem.content_type || "educational"}
                  onValueChange={(v) => handleFieldChange("content_type", v)}
                >
                  <SelectTrigger style={selectTriggerStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CONTENT_TYPES.map((ct) => (
                      <SelectItem key={ct.value} value={ct.value}>
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Date & Priority (2-col) ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  value={currentItem.date || defaultDate || ""}
                  onChange={(e) => handleFieldChange("date", e.target.value)}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <label style={labelStyle}>Priority</label>
                <Select
                  value={currentItem.priority || "medium"}
                  onValueChange={(v) => handleFieldChange("priority", v)}
                >
                  <SelectTrigger style={selectTriggerStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <hr style={dividerStyle} />

            {/* ── Caption Direction ── */}
            <div>
              <label style={labelStyle}>Caption Direction</label>
              <textarea
                value={currentItem.caption_direction || ""}
                onChange={(e) => handleFieldChange("caption_direction", e.target.value)}
                placeholder="Brief direction for caption writer..."
                style={textareaStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* ── Visual Direction ── */}
            <div>
              <label style={labelStyle}>Visual Direction</label>
              <textarea
                value={currentItem.visual_direction || ""}
                onChange={(e) => handleFieldChange("visual_direction", e.target.value)}
                placeholder="Brief direction for image generator..."
                style={textareaStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <hr style={dividerStyle} />

            {/* ── Occasion ── */}
            <div>
              <label style={labelStyle}>Occasion</label>
              <input
                value={currentItem.occasion || ""}
                onChange={(e) => handleFieldChange("occasion", e.target.value || null)}
                placeholder="Festival, event, awareness day..."
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          </div>
        </div>

        {/* ═══════════ FIXED BOTTOM BUTTONS ═══════════ */}
        <div
          style={{
            flexShrink: 0,
            padding: "24px 32px 32px 32px",
            borderTop: "1px solid #F1F5F9",
            backgroundColor: "#FFFFFF",
          }}
        >
          {isNew ? (
            <Button
              onClick={handleSaveNew}
              disabled={saving}
              style={{
                width: "100%",
                height: 52,
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 12,
                backgroundColor: "#4F46E5",
                color: "#FFFFFF",
              }}
              className="hover:bg-[#4338CA]"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Add Post
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  if (!item?.id) return;
                  const st = item.status;

                  // If image_generated → send for approval directly
                  if (st === "image_generated") {
                    supabase
                      .from("content_calendar")
                      .update({ status: "pending_approval" })
                      .eq("id", item.id)
                      .then(({ error }) => {
                        if (error) {
                          toast.error("Failed to send for approval");
                        } else {
                          toast.success("Post sent to Approval Queue!");
                          onUpdate({ ...item, status: "pending_approval" } as CalendarItem);
                          onOpenChange(false);
                          router.push("/dashboard/approval");
                        }
                      });
                    return;
                  }

                  // If pending_approval or approved → go to approval queue
                  if (st === "pending_approval" || st === "approved") {
                    onOpenChange(false);
                    router.push("/dashboard/approval");
                    return;
                  }

                  // If posted → go to analytics
                  if (st === "posted") {
                    onOpenChange(false);
                    router.push("/dashboard/analytics");
                    return;
                  }

                  // Default → go to caption & image studio
                  handleOpenStudio();
                }}
                style={{
                  width: "100%",
                  height: 52,
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 12,
                  backgroundColor:
                    item?.status === "pending_approval" ? "#F59E0B"
                    : item?.status === "approved" ? "#16A34A"
                    : item?.status === "posted" ? "#7C3AED"
                    : item?.status === "image_generated" ? "#4F46E5"
                    : undefined,
                }}
                className={`text-white shadow-[0_4px_16px_rgba(79,70,229,0.3)] ${
                  !["pending_approval", "approved", "posted", "image_generated"].includes(item?.status || "")
                    ? "gradient-primary hover:opacity-90"
                    : "hover:opacity-90"
                }`}
              >
                {(() => {
                  const st = item?.status || "scheduled";
                  if (st === "scheduled") return "Generate Caption & Image →";
                  if (st === "caption_generated") return "Generate Image →";
                  if (st === "image_generated") return "Send for Approval →";
                  if (st === "pending_approval") return "View in Approval Queue →";
                  if (st === "approved") return "View Scheduled Post →";
                  if (st === "posted") return "View Analytics →";
                  return "Open Caption & Image Studio →";
                })()}
              </Button>
              <button
                onClick={handleDelete}
                style={{
                  width: "100%",
                  height: 44,
                  marginTop: 12,
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #FEE2E2",
                  color: "#EF4444",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
              >
                <Trash2 style={{ width: 16, height: 16 }} />
                Delete Post
              </button>
            </>
          )}
        </div>

        {/* Spin keyframes for regenerate icon */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </SheetContent>
    </Sheet>
  );
}
