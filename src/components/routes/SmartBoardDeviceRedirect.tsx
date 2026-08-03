import { Navigate } from "react-router-dom";
import { readSmartBoardSession } from "@/lib/smartboardSession";

/**
 * Kiosk behaviour: once a device has been signed in as a classroom SmartBoard,
 * opening the app root goes straight back to that board's classroom screen.
 */
export function SmartBoardDeviceRedirect({ children }: { children: React.ReactNode }) {
  const session = readSmartBoardSession();
  // No expiry check — a board stays signed in until Exit or an admin reissue.
  if (session?.deviceToken) return <Navigate to="/smartboard/classroom" replace />;
  return <>{children}</>;
}

export default SmartBoardDeviceRedirect;