import { useState, useEffect } from 'react';
import { CurrencyCode, detectCurrency } from '@/lib/currencyUtils';
import { supabase } from '@/integrations/supabase/client';

export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCurrency = async () => {
      // Check localStorage first for quick load
      const stored = localStorage.getItem('preferred_currency') as CurrencyCode;
      if (stored) {
        setCurrencyState(stored);
        setIsLoading(false);
      }

      // Check if user is logged in and has preference
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_currency')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.preferred_currency) {
          setCurrencyState(profile.preferred_currency as CurrencyCode);
          localStorage.setItem('preferred_currency', profile.preferred_currency);
          setIsLoading(false);
          return;
        }
      }

      // Auto-detect from timezone/locale if no stored preference
      if (!stored) {
        const detected = detectCurrency(session?.user?.email);
        setCurrencyState(detected);
        localStorage.setItem('preferred_currency', detected);
      }
      setIsLoading(false);
    };

    loadCurrency();
  }, []);

  const setCurrency = async (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('preferred_currency', newCurrency);

    // Update profile if logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase
        .from('profiles')
        .update({ preferred_currency: newCurrency })
        .eq('id', session.user.id);
    }
  };

  return { currency, setCurrency, isLoading };
}
