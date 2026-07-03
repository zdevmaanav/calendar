"use client";

import { motion } from "framer-motion";
import {
  ClipboardList,
  PenTool,
  Image as ImageIcon,
  ShieldCheck,
  Send,
  Check,
} from "lucide-react";

interface PipelineProgressProps {
  status: string;
  compact?: boolean;
}

const STEPS = [
  { key: "details", label: "Details", icon: ClipboardList },
  { key: "caption", label: "Caption", icon: PenTool },
  { key: "image", label: "Image", icon: ImageIcon },
  { key: "approval", label: "Approval", icon: ShieldCheck },
  { key: "posted", label: "Posted", icon: Send },
];

function getCompletedSteps(status: string): number {
  switch (status) {
    case "scheduled":
      return 1;
    case "caption_generated":
      return 2;
    case "image_generated":
      return 3;
    case "pending_approval":
      return 3;
    case "approved":
      return 4;
    case "posted":
      return 5;
    case "rejected":
      return 3;
    case "post_failed":
      return 4;
    default:
      return 0;
  }
}

export function PipelineProgress({ status, compact = false }: PipelineProgressProps) {
  const completedSteps = getCompletedSteps(status);

  return (
    <div className={`flex items-center w-full ${compact ? "gap-1" : "gap-0"}`}>
      {STEPS.map((step, index) => {
        const isCompleted = index < completedSteps;
        const isCurrent = index === completedSteps;
        const StepIcon = step.icon;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                className={`
                  relative flex items-center justify-center rounded-full transition-all duration-300
                  ${compact ? "w-7 h-7" : "w-9 h-9"}
                  ${
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
                      : isCurrent
                      ? "bg-[#4F46E5] text-white shadow-[0_2px_12px_rgba(79,70,229,0.35)]"
                      : "bg-[#F5F5F3] text-[#0A0A0A]/25"
                  }
                `}
              >
                {isCompleted ? (
                  <Check className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                ) : (
                  <StepIcon className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                )}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#4F46E5]"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
              <span
                className={`
                  text-center leading-tight transition-colors duration-200
                  ${compact ? "text-[9px]" : "text-[10px]"}
                  ${
                    isCompleted
                      ? "text-emerald-600 font-semibold"
                      : isCurrent
                      ? "text-[#4F46E5] font-semibold"
                      : "text-[#0A0A0A]/25 font-medium"
                  }
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div className={`flex-1 ${compact ? "mx-1" : "mx-2"} mb-5`}>
                <div className="relative h-[2px] w-full bg-[#E8E8E8] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ delay: index * 0.1 + 0.15, duration: 0.4 }}
                    className="absolute left-0 top-0 h-full bg-emerald-400 rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
