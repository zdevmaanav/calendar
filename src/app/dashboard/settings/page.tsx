"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Building2,
  Globe,
  Upload,
  Save,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  IconInstagram as Instagram,
  IconFacebook as Facebook,
  IconYoutube as Youtube,
  IconTwitter as Twitter,
  IconLinkedin as Linkedin,
} from "@/components/icons";

const INDUSTRIES = [
  "Education",
  "Fashion",
  "Food & Beverage",
  "Healthcare",
  "Real Estate",
  "Retail",
  "Tech",
  "Other",
];

interface OrgData {
  id: string;
  name: string;
  industry: string;
  website_url: string;
  instagram_handle: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  twitter_handle: string | null;
  linkedin_url: string | null;
  logo_url: string | null;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, type: "tween" as const } },
};

export default function SettingsPage() {
  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const supabase = createClient();
  const router = useRouter();

  // Form fields
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  useEffect(() => {
    async function fetchOrg() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (orgData) {
          setOrg(orgData);
          setOrgName(orgData.name);
          setIndustry(orgData.industry || "");
          setWebsiteUrl(orgData.website_url);
          setInstagramHandle(orgData.instagram_handle || "");
          setFacebookUrl(orgData.facebook_url || "");
          setYoutubeUrl(orgData.youtube_url || "");
          setTwitterHandle(orgData.twitter_handle || "");
          setLinkedinUrl(orgData.linkedin_url || "");
        }
      }

      setLoading(false);
    }

    fetchOrg();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Upload new logo if provided
      let logoUrl = org.logo_url;
      if (logoFile && user) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `${user.id}/logo.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("brand-assets")
          .upload(filePath, logoFile, { upsert: true });

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("brand-assets").getPublicUrl(filePath);
          logoUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from("organizations")
        .update({
          name: orgName,
          industry,
          website_url: websiteUrl,
          instagram_handle: instagramHandle || null,
          facebook_url: facebookUrl || null,
          youtube_url: youtubeUrl || null,
          twitter_handle: twitterHandle || null,
          linkedin_url: linkedinUrl || null,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", org.id);

      if (error) {
        toast.error("Failed to save: " + error.message);
      } else {
        toast.success("Settings saved successfully!");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && org) {
        // Delete brand profiles
        await supabase
          .from("brand_profiles")
          .delete()
          .eq("org_id", org.id);

        // Delete organization
        await supabase
          .from("organizations")
          .delete()
          .eq("id", org.id);

        // Sign out
        await supabase.auth.signOut();
        toast.success("Account deleted successfully");
        router.push("/auth/login");
      }
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-[700px]">
        <Skeleton className="h-10 w-48 rounded-xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[700px]"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="font-display text-2xl font-bold text-[#0A0A0A] tracking-tight">
          Settings
        </h1>
        <p className="text-[#0A0A0A]/50 mt-1 text-sm">
          Manage your organization details and integrations
        </p>
      </motion.div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Details */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6 lg:p-8">
              <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-5 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0A0A0A]/70" />
                Organization Details
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#0A0A0A]">
                    Organization Name
                  </Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="h-11 bg-[#FAFAFA] border-[rgba(0,0,0,0.08)] rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#0A0A0A]">
                    Industry
                  </Label>
                  <Select value={industry} onValueChange={(v) => setIndustry(v ?? "")}>
                    <SelectTrigger className="h-11 bg-[#FAFAFA] border-[rgba(0,0,0,0.08)] rounded-xl">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#0A0A0A]">
                    Website URL
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/50" />
                    <Input
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="pl-10 h-11 bg-[#FAFAFA] border-[rgba(0,0,0,0.08)] rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Social Media Links */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6 lg:p-8">
              <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-5">
                Social Media Handles
              </h3>
              <div className="space-y-3">
                {[
                  {
                    icon: <Instagram className="w-4 h-4" />,
                    value: instagramHandle,
                    setter: setInstagramHandle,
                    placeholder: "@instagram_handle",
                  },
                  {
                    icon: <Facebook className="w-4 h-4" />,
                    value: facebookUrl,
                    setter: setFacebookUrl,
                    placeholder: "Facebook Page URL",
                  },
                  {
                    icon: <Youtube className="w-4 h-4" />,
                    value: youtubeUrl,
                    setter: setYoutubeUrl,
                    placeholder: "YouTube Channel URL",
                  },
                  {
                    icon: <Twitter className="w-4 h-4" />,
                    value: twitterHandle,
                    setter: setTwitterHandle,
                    placeholder: "@twitter_handle",
                  },
                  {
                    icon: <Linkedin className="w-4 h-4" />,
                    value: linkedinUrl,
                    setter: setLinkedinUrl,
                    placeholder: "LinkedIn Company URL",
                  },
                ].map((social, i) => (
                  <div key={i} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0A0A0A]/50">
                      {social.icon}
                    </span>
                    <Input
                      value={social.value}
                      onChange={(e) => social.setter(e.target.value)}
                      placeholder={social.placeholder}
                      className="pl-10 h-10 bg-[#FAFAFA] border-[rgba(0,0,0,0.08)] rounded-xl text-sm"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Brand Assets */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6 lg:p-8">
              <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-5">
                Brand Assets
              </h3>
              <div>
                <Label className="text-sm font-medium text-[#0A0A0A] block mb-2">
                  Organization Logo
                </Label>
                <label className="flex items-center gap-3 px-4 py-3 bg-[#FAFAFA] border border-dashed border-[rgba(0,0,0,0.06)] rounded-xl cursor-pointer hover:border-[#4F46E5]/30 transition-colors">
                  <Upload className="w-4 h-4 text-[#0A0A0A]/50" />
                  <span className="text-sm text-[#0A0A0A]/50">
                    {logoFile
                      ? logoFile.name
                      : org?.logo_url
                      ? "Replace current logo"
                      : "Upload logo image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setLogoFile(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={item}>
          <Button
            type="submit"
            disabled={saving}
            className="h-11 px-8 rounded-xl text-white font-medium gradient-primary hover:opacity-90 transition-all shadow-[0_4px_12px_rgba(79,70,229,0.25)]"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </motion.div>
      </form>

      {/* Danger Zone */}
      <motion.div variants={item}>
        <Separator className="my-2 bg-transparent" />
        <Card className="border border-red-200/50 shadow-card rounded-2xl bg-red-50/30">
          <CardContent className="p-6 lg:p-8">
            <h3 className="font-display text-lg font-semibold text-red-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-sm text-red-600/70 mb-4">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger>
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display">
                    Are you absolutely sure?
                  </DialogTitle>
                  <DialogDescription>
                    This will permanently delete your organization, brand
                    profile, and all associated data. This action cannot be
                    undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="rounded-xl"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete Everything
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
