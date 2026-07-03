"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Check,
  X,
  Edit3,
  Clock,
  Image as ImageIcon,
  RotateCcw,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { IconInstagram, IconFacebook, IconYoutube } from "@/components/icons";

interface ApprovalItem {
  id: string;
  org_id: string;
  date: string;
  platform: string;
  content_type: string;
  topic: string;
  generated_caption: string | null;
  generated_hashtags: string[];
  generated_image_url: string | null;
  status: string;
  scheduled_post_time: string | null;
  rejection_reason: string | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function PlatformBadge({ platform }: { platform: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: <IconInstagram className="w-3 h-3" />,
    facebook: <IconFacebook className="w-3 h-3" />,
    youtube: <IconYoutube className="w-3 h-3" />,
  };

  return (
    <Badge className="bg-[#F5F5F3] text-[#0A0A0A]/70 gap-1 rounded-lg px-2 py-0.5 text-[10px]">
      {icons[platform] || null}
      {platform}
    </Badge>
  );
}

const STATUS_STYLES: Record<string, { text: string; color: string }> = {
  pending_approval: { text: "Pending", color: "bg-amber-100 text-amber-700" },
  approved: { text: "Approved", color: "bg-emerald-100 text-emerald-700" },
  rejected: { text: "Rejected", color: "bg-red-100 text-red-700" },
  posted: { text: "Posted", color: "bg-green-100 text-green-700" },
  post_failed: { text: "Failed", color: "bg-red-100 text-red-700" },
  image_generated: { text: "Pending", color: "bg-amber-100 text-amber-700" },
};

export default function ApprovalPage() {
  const supabase = createClient();
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [filter, setFilter] = useState("all");
  const [editItem, setEditItem] = useState<ApprovalItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectItemId, setRejectItemId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveItemId, setApproveItemId] = useState<string | null>(null);
  const [scheduleTime, setScheduleTime] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApprovalItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!org) return;
    setOrgId(org.id);

    const statuses = ["pending_approval", "approved", "rejected", "posted", "post_failed", "image_generated"];

    const { data } = await supabase
      .from("content_calendar")
      .select("*")
      .eq("org_id", org.id)
      .in("status", statuses)
      .order("date", { ascending: true });

    setItems(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleApprove = async (itemId: string) => {
    setProcessing(itemId);
    try {
      const res = await fetch("/api/approve-post", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendar_item_id: itemId,
          org_id: orgId,
          action: "approve",
          scheduled_post_time: scheduleTime || null,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: "approved" } : i))
      );
      toast.success(
        scheduleTime
          ? `Post approved and scheduled for ${new Date(scheduleTime).toLocaleString()}!`
          : "Post approved!"
      );
      setApproveModalOpen(false);
      setScheduleTime("");
    } catch {
      toast.error("Failed to approve post");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectItemId) return;

    setProcessing(rejectItemId);
    try {
      const res = await fetch("/api/approve-post", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendar_item_id: rejectItemId,
          org_id: orgId,
          action: "reject",
          rejection_reason: rejectReason,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      setItems((prev) =>
        prev.map((i) =>
          i.id === rejectItemId ? { ...i, status: "rejected", rejection_reason: rejectReason } : i
        )
      );
      toast.success("Post rejected");
      setRejectModalOpen(false);
      setRejectReason("");
    } catch {
      toast.error("Failed to reject post");
    } finally {
      setProcessing(null);
    }
  };

  const handleSendBack = async (itemId: string) => {
    setProcessing(itemId);
    try {
      const res = await fetch("/api/approve-post", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendar_item_id: itemId,
          org_id: orgId,
          action: "send_back",
        }),
      });

      if (!res.ok) throw new Error("Failed");

      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Post sent back to calendar for regeneration");
    } catch {
      toast.error("Failed to send back");
    } finally {
      setProcessing(null);
    }
  };

  // Move rejected post back to pending
  const handleMoveToPending = async (itemId: string) => {
    setProcessing(itemId);
    try {
      const { error } = await supabase
        .from("content_calendar")
        .update({ status: "pending_approval", rejection_reason: null })
        .eq("id", itemId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, status: "pending_approval", rejection_reason: null } : i
        )
      );
      toast.success("Post moved back to Pending");
    } catch {
      toast.error("Failed to update post status");
    } finally {
      setProcessing(null);
    }
  };

  // Delete post
  const handleDeletePost = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/delete-post", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: deleteItem.id,
          org_id: orgId,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      setItems((prev) => prev.filter((i) => i.id !== deleteItem.id));
      toast.success("Post deleted successfully");
      setDeleteModalOpen(false);
      setDeleteItem(null);
    } catch {
      toast.error("Failed to delete post. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = items.filter((i) => {
    if (filter === "all") return true;
    if (filter === "pending") return i.status === "pending_approval" || i.status === "image_generated";
    return i.status === filter;
  });

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1200px]">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
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
      <motion.div variants={cardAnim}>
        <h1 className="font-display text-2xl font-bold text-[#0A0A0A] tracking-tight">
          Approval Queue
        </h1>
        <p className="text-sm text-[#0A0A0A]/50 mt-0.5">
          Review and approve generated posts before publishing
        </p>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={cardAnim}>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-[#F5F5F3] rounded-xl p-1 h-auto">
            {[
              { value: "all", label: "All" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {tab.label}
                <Badge className="ml-2 bg-[#0A0A0A]/[0.06] text-[#0A0A0A] text-[10px] px-1.5">
                  {tab.value === "all"
                    ? items.length
                    : tab.value === "pending"
                    ? items.filter((i) => i.status === "pending_approval" || i.status === "image_generated").length
                    : items.filter((i) => i.status === tab.value).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Post Cards Grid */}
      {filteredItems.length === 0 ? (
        <motion.div variants={cardAnim}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#0A0A0A]/[0.06] flex items-center justify-center mx-auto mb-3">
                <Check className="w-5 h-5 text-[#4F46E5]" />
              </div>
              <p className="text-sm font-medium text-[#0A0A0A]">No posts to review</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-1">
                Generate content from the Content Calendar to see posts here
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredItems.map((post) => {
              const status = STATUS_STYLES[post.status] || STATUS_STYLES.pending_approval;

              return (
                <motion.div
                  key={post.id}
                  variants={cardAnim}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="border-0 shadow-card rounded-2xl overflow-hidden hover:shadow-card-hover transition-all">
                    {/* Image */}
                    {post.generated_image_url ? (
                      <div className="aspect-square relative bg-[#F5F5F3] overflow-hidden">
                        <img
                          src={post.generated_image_url}
                          alt={post.topic}
                          className="w-full h-full object-cover"
                        />
                        {/* Status badge — top right */}
                        <div className="absolute top-2 right-2">
                          <Badge className={`${status.color} text-[10px]`}>{status.text}</Badge>
                        </div>
                        {/* Delete button — top left */}
                        <button
                          onClick={() => {
                            setDeleteItem(post);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete post"
                          className="absolute top-2 left-2 flex items-center justify-center transition-colors"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            backgroundColor: "rgba(255,255,255,0.9)",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#FEF2F2";
                            const icon = e.currentTarget.querySelector("svg");
                            if (icon) (icon as SVGElement).style.color = "#DC2626";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.9)";
                            const icon = e.currentTarget.querySelector("svg");
                            if (icon) (icon as SVGElement).style.color = "#EF4444";
                          }}
                        >
                          <Trash2 style={{ width: 14, height: 14, color: "#EF4444" }} />
                        </button>
                      </div>
                    ) : (
                      <div className="aspect-video relative bg-[#F5F5F3] flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-[#0A0A0A]/25" />
                        {/* Delete button — top left (no-image variant) */}
                        <button
                          onClick={() => {
                            setDeleteItem(post);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete post"
                          className="absolute top-2 left-2 flex items-center justify-center transition-colors"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            backgroundColor: "rgba(255,255,255,0.9)",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#FEF2F2";
                            const icon = e.currentTarget.querySelector("svg");
                            if (icon) (icon as SVGElement).style.color = "#DC2626";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.9)";
                            const icon = e.currentTarget.querySelector("svg");
                            if (icon) (icon as SVGElement).style.color = "#EF4444";
                          }}
                        >
                          <Trash2 style={{ width: 14, height: 14, color: "#EF4444" }} />
                        </button>
                      </div>
                    )}

                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={post.platform} />
                        <span className="text-[10px] text-[#0A0A0A]/50">
                          {new Date(post.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-[#0A0A0A] line-clamp-2">
                        {post.topic}
                      </p>

                      {post.generated_caption && (
                        <p className="text-xs text-[#0A0A0A]/50 line-clamp-3">
                          {post.generated_caption}
                        </p>
                      )}

                      {post.rejection_reason && (
                        <div className="p-2 rounded-lg bg-red-50 border border-red-100">
                          <div className="flex items-center gap-1 mb-1">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span className="text-[10px] font-semibold text-red-600">Rejection Reason</span>
                          </div>
                          <p className="text-xs text-red-600">{post.rejection_reason}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-[rgba(0,0,0,0.06)]">
                        {(post.status === "pending_approval" || post.status === "image_generated") && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setApproveItemId(post.id);
                                setApproveModalOpen(true);
                              }}
                              disabled={processing === post.id}
                              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditItem(post);
                                setEditModalOpen(true);
                              }}
                              className="rounded-xl border-[rgba(0,0,0,0.08)] text-xs"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectItemId(post.id);
                                setRejectModalOpen(true);
                              }}
                              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {post.status === "rejected" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMoveToPending(post.id)}
                              disabled={processing === post.id}
                              className="flex-1 rounded-xl text-xs"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Move to Pending
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendBack(post.id)}
                              disabled={processing === post.id}
                              className="rounded-xl text-xs"
                            >
                              Send Back
                            </Button>
                          </>
                        )}
                        {post.status === "approved" && (
                          <>
                            <Badge className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 flex-1 justify-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Scheduled
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditItem(post);
                                setEditModalOpen(true);
                              }}
                              className="rounded-xl border-[rgba(0,0,0,0.08)] text-xs"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Approve & Schedule Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]/50">
                Schedule Time (optional)
              </Label>
              <Input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="mt-1.5 rounded-xl"
              />
              <p className="text-[10px] text-[#0A0A0A]/50 mt-1">
                Leave empty to post as soon as possible
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setApproveModalOpen(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => approveItemId && handleApprove(approveItemId)}
                disabled={!!processing}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Approval"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Reject Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]/50">
                Reason (optional)
              </Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Why is this post being rejected?"
                className="mt-1.5 rounded-xl min-h-[80px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!!processing}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject Post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Delete this post?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-[#0A0A0A]/50">
              This will permanently delete the post{" "}
              <span className="font-medium text-[#0A0A0A]">
                &ldquo;{deleteItem?.topic}&rdquo;
              </span>{" "}
              and remove it from your calendar. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteItem(null);
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeletePost}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                Delete Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Post</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Image */}
              <div>
                {editItem.generated_image_url ? (
                  <img
                    src={editItem.generated_image_url}
                    alt={editItem.topic}
                    className="w-full rounded-xl"
                  />
                ) : (
                  <div className="aspect-square bg-[#F5F5F3] rounded-xl flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-[#0A0A0A]/25" />
                  </div>
                )}
              </div>

              {/* Caption editor */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]/50">
                    Caption
                  </Label>
                  <Textarea
                    value={editItem.generated_caption || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, generated_caption: e.target.value })
                    }
                    className="mt-1.5 rounded-xl min-h-[200px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]/50">
                    Hashtags
                  </Label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(editItem.generated_hashtags || []).map((tag, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-[#F5F5F3] text-[#0A0A0A]/70 rounded-lg text-xs cursor-pointer hover:bg-red-50 hover:text-red-600"
                        onClick={() => {
                          const updated = editItem.generated_hashtags.filter((_, idx) => idx !== i);
                          setEditItem({ ...editItem, generated_hashtags: updated });
                        }}
                      >
                        {tag} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    await supabase
                      .from("content_calendar")
                      .update({
                        generated_caption: editItem.generated_caption,
                        generated_hashtags: editItem.generated_hashtags,
                        is_edited_by_user: true,
                      })
                      .eq("id", editItem.id);

                    setItems((prev) =>
                      prev.map((i) => (i.id === editItem.id ? { ...i, ...editItem, is_edited_by_user: true } : i))
                    );
                    setEditModalOpen(false);
                    toast.success("Changes saved");
                  }}
                  className="w-full rounded-xl bg-[#4F46E5] hover:bg-[#4338CA]"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
