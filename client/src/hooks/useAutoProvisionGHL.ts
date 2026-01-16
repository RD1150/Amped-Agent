import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Automatically creates a GHL sub-account for the user on first login
 * This hook should be called in DashboardLayout or a similar top-level component
 */
export function useAutoProvisionGHL() {
  const { user } = useAuth();
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioningError, setProvisioningError] = useState<string | null>(null);

  const createSubAccount = trpc.ghl.createSubAccount.useMutation({
    onSuccess: () => {
      console.log("[GHL] Sub-account created successfully");
      setIsProvisioning(false);
    },
    onError: (error) => {
      console.error("[GHL] Failed to create sub-account:", error.message);
      setProvisioningError(error.message);
      setIsProvisioning(false);
    },
  });

  useEffect(() => {
    // Only run if user is logged in and doesn't have a sub-account yet
    if (user && !user.ghlSubAccountId && !isProvisioning && !provisioningError) {
      setIsProvisioning(true);
      
      // Create sub-account with user's info
      createSubAccount.mutate({
        name: user.name || `${user.email}'s Account`,
        email: user.email || `user${user.id}@realtycontentagent.com`,
      });
    }
  }, [user, isProvisioning, provisioningError]);

  return {
    isProvisioning,
    provisioningError,
  };
}
