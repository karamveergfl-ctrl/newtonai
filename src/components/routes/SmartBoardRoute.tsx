import { Navigate } from "react-router-dom";
import { readSmartBoardSession } from "@/lib/smartboardSession";

/**
 * Guards the classroom screen. A board is activated once and stays signed in,
 * so this only checks that a device token exists locally — the server
 * re-validates the token on every call.
 */
export function SmartBoardRoute({ children }: { children: React.ReactNode }) {
  const session = readSmartBoardSession();
  if (!session) return <Navigate to="/smartboard/activate" replace />;
  return <>{children}</>;
}

export default SmartBoardRoute;