import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Sparkles, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarPromoCardProps {
  isCollapsed?: boolean;
}

const promoFeatures = [
  "Unlimited generations",
  "Priority support",
  "Advanced features",
];

export function SidebarPromoCard({ isCollapsed = false }: SidebarPromoCardProps) {
  const navigate = useNavigate();

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/pricing")}
            className="flex items-center justify-center w-full p-2.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-colors"
          >
            <Crown className="h-4 w-4 text-amber-500" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-semibold text-amber-500">Upgrade to Pro</p>
            <p className="text-xs text-muted-foreground">
              Unlock unlimited access to all study tools
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-2 mb-2"
    >
      <div className="relative overflow-hidden rounded-xl p-[1px] bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500">
        <div className="relative rounded-[11px] bg-background/95 backdrop-blur-sm p-4">
          {/* Decorative sparkles */}
          <div className="absolute top-2 right-2">
            <Sparkles className="h-4 w-4 text-amber-500/50 animate-pulse" />
          </div>
          
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Go Pro</h4>
              <p className="text-[10px] text-muted-foreground">Unlock everything</p>
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-1.5 mb-3">
            {promoFeatures.map((feature, index) => (
              <motion.li
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Check className="h-3 w-3 text-green-500 shrink-0" />
                {feature}
              </motion.li>
            ))}
          </ul>

          {/* CTA Button */}
          <Button
            onClick={() => navigate("/pricing")}
            size="sm"
            className={cn(
              "w-full h-8 text-xs font-semibold",
              "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
              "text-white shadow-lg hover:shadow-xl transition-all"
            )}
          >
            <Zap className="h-3 w-3 mr-1.5" />
            Upgrade Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
