import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RedeemCodeState {
  codeId: string | null;
  discountPercent: number;
  isValidated: boolean;
}

export function useRedeemCode() {
  const [redeemCode, setRedeemCode] = useState<RedeemCodeState>({
    codeId: null,
    discountPercent: 0,
    isValidated: false,
  });

  const applyCode = useCallback((codeId: string, discountPercent: number) => {
    setRedeemCode({
      codeId,
      discountPercent,
      isValidated: true,
    });
  }, []);

  const clearCode = useCallback(() => {
    setRedeemCode({
      codeId: null,
      discountPercent: 0,
      isValidated: false,
    });
  }, []);

  const recordCodeUsage = useCallback(async (paymentId: string) => {
    if (!redeemCode.codeId) return;

    try {
      await supabase.rpc("apply_redeem_code", {
        p_code_id: redeemCode.codeId,
        p_payment_id: paymentId,
      });
    } catch (error) {
      console.error("Error recording code usage:", error);
    }
  }, [redeemCode.codeId]);

  const calculateDiscountedAmount = useCallback((originalAmount: number) => {
    if (!redeemCode.isValidated || redeemCode.discountPercent === 0) {
      return originalAmount;
    }
    const discount = (originalAmount * redeemCode.discountPercent) / 100;
    return Math.round(originalAmount - discount);
  }, [redeemCode]);

  return {
    redeemCode,
    applyCode,
    clearCode,
    recordCodeUsage,
    calculateDiscountedAmount,
  };
}
