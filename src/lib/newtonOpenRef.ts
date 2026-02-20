// Shared ref for Newton open function so MobileBottomNav can trigger it
export const newtonOpenRef = { current: null as (() => void) | null };

export function getNewtonOpenFn() {
  return newtonOpenRef.current;
}
