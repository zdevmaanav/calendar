"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload,
  Trash2,

  Video,

  Shield,
  Sparkles,
  FileImage,
  Loader2,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

interface Asset {
  id: string;
  org_id: string;
  category: "brand" | "post_ready";
  file_url: string;
  thumbnail_url: string | null;
  file_type: "image" | "video";
  filename: string;
  file_size: number;
  is_active_for_generation: boolean;
  created_at: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AssetsPage() {
  const supabase = createClient();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("brand");

  const fetchAssets = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!org) return;
    setOrgId(org.id);

    const res = await fetch(`/api/assets?org_id=${org.id}`);
    const data = await res.json();
    setAssets(data.assets || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleUpload = async (files: File[]) => {
    if (!orgId) return;

    setUploading(true);
    setUploadProgress(0);
    const totalFiles = files.length;
    let completed = 0;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("org_id", orgId);
      formData.append("category", activeTab);

      try {
        const res = await fetch("/api/upload-asset", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setAssets((prev) => [data.asset, ...prev]);
        completed++;
        setUploadProgress(Math.round((completed / totalFiles) * 100));
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    if (completed > 0) {
      toast.success(`${completed} file${completed > 1 ? "s" : ""} uploaded!`);
    }
  };

  const handleDelete = async (assetId: string) => {
    try {
      const res = await fetch("/api/assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: assetId, org_id: orgId }),
      });

      if (!res.ok) throw new Error("Delete failed");

      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      toast.success("Asset deleted");
    } catch {
      toast.error("Failed to delete asset");
    }
  };

  const handleToggleActive = async (assetId: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/assets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: assetId,
          org_id: orgId,
          is_active_for_generation: !currentActive,
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId ? { ...a, is_active_for_generation: !currentActive } : a
        )
      );
      toast.success(!currentActive ? "Asset enabled for generation" : "Asset disabled for generation");
    } catch {
      toast.error("Failed to update asset");
    }
  };

  const brandAssets = assets.filter((a) => a.category === "brand");
  const postReadyAssets = assets.filter((a) => a.category === "post_ready");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const DropZone = (_props: { category: string }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/webp": [".webp"],
        "video/mp4": [".mp4"],
        "video/quicktime": [".mov"],
      },
      onDrop: handleUpload,
      multiple: true,
    });

    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-[#4F46E5] bg-[rgba(79,70,229,0.08)]"
            : "border-[rgba(0,0,0,0.08)] hover:border-[#4F46E5]/50 hover:bg-[#FAFAFA]"
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 rounded-xl bg-[#0A0A0A]/[0.06] flex items-center justify-center mx-auto mb-3">
          <Upload className="w-5 h-5 text-[#4F46E5]" />
        </div>
        <p className="text-sm font-medium text-[#0A0A0A]">
          {isDragActive ? "Drop files here" : "Drag & drop files or click to upload"}
        </p>
        <p className="text-xs text-[#0A0A0A]/50 mt-1">
          JPG, PNG, WebP, MP4, MOV supported
        </p>
      </div>
    );
  };

  const AssetGrid = ({ items, showToggle }: { items: Asset[]; showToggle: boolean }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {items.map((asset) => (
        <motion.div
          key={asset.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="group"
        >
          <Card className="border-0 shadow-card rounded-xl overflow-hidden hover:shadow-card-hover transition-all">
            {/* Thumbnail */}
            <div className="aspect-square relative bg-[#F5F5F3] overflow-hidden">
              {asset.file_type === "image" ? (
                <img
                  src={asset.file_url}
                  alt={asset.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-10 h-10 text-[#0A0A0A]/25" />
                </div>
              )}

              {/* Delete overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(asset.id)}
                  className="rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Info */}
            <CardContent className="p-3">
              <p className="text-xs font-medium text-[#0A0A0A] truncate">{asset.filename}</p>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#0A0A0A]/50">{formatFileSize(asset.file_size)}</span>
                  <span className="text-[10px] text-[#0A0A0A]/25">·</span>
                  <span className="text-[10px] text-[#0A0A0A]/50">{formatDate(asset.created_at)}</span>
                </div>
              </div>

              {showToggle && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[rgba(0,0,0,0.06)]">
                  <span className="text-[10px] text-[#0A0A0A]/50">Use in generation</span>
                  <Switch
                    checked={asset.is_active_for_generation}
                    onCheckedChange={() => handleToggleActive(asset.id, asset.is_active_for_generation)}
                    className="h-4 w-7"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1200px]">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
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
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="font-display text-2xl font-bold text-[#0A0A0A] tracking-tight">
          Asset Library
        </h1>
        <p className="text-sm text-[#0A0A0A]/50 mt-0.5">
          Manage brand assets and post-ready images for AI generation
        </p>
      </motion.div>

      {/* Upload Progress */}
      {uploading && (
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-4 flex items-center gap-4">
              <Loader2 className="w-5 h-5 text-[#4F46E5] animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0A0A0A]">Uploading files...</p>
                <Progress value={uploadProgress} className="mt-2 h-1.5" />
              </div>
              <span className="text-sm font-medium text-[#4F46E5]">{uploadProgress}%</span>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div variants={item}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#F5F5F3] rounded-xl p-1 h-auto">
            <TabsTrigger
              value="brand"
              className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Shield className="w-4 h-4 mr-2" />
              Brand Assets
              <Badge className="ml-2 bg-[rgba(79,70,229,0.08)] text-[#4F46E5] text-[10px] px-1.5">
                {brandAssets.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="post_ready"
              className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Post-Ready Assets
              <Badge className="ml-2 bg-[rgba(79,70,229,0.08)] text-[#4F46E5] text-[10px] px-1.5">
                {postReadyAssets.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brand" className="mt-4">
            <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <Shield className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">AI Learning Only</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      AI studies these to understand your brand style, colors, and aesthetic.
                      These are never used directly in generated posts.
                    </p>
                  </div>
                </div>

                <DropZone category="brand" />
                <AssetGrid items={brandAssets} showToggle={false} />
                {brandAssets.length === 0 && !uploading && (
                  <div className="text-center py-8">
                    <FileImage className="w-10 h-10 text-[#0A0A0A]/25 mx-auto mb-2" />
                    <p className="text-sm text-[#0A0A0A]/50">No brand assets yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="post_ready" className="mt-4">
            <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-[rgba(79,70,229,0.06)] border border-[rgba(79,70,229,0.12)]">
                  <Sparkles className="w-5 h-5 text-[#4F46E5] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#0A0A0A]">Approved for Post Generation</p>
                    <p className="text-xs text-[#0A0A0A]/50 mt-0.5">
                      Toggle &ldquo;Use in generation&rdquo; on each asset. When enabled, AI can reference these
                      in your posts only when you turn on &ldquo;Use my assets&rdquo; toggle.
                    </p>
                  </div>
                </div>

                <DropZone category="post_ready" />
                <AssetGrid items={postReadyAssets} showToggle={true} />
                {postReadyAssets.length === 0 && !uploading && (
                  <div className="text-center py-8">
                    <FileImage className="w-10 h-10 text-[#0A0A0A]/25 mx-auto mb-2" />
                    <p className="text-sm text-[#0A0A0A]/50">No post-ready assets yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
