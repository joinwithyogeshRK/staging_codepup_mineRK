import React from "react";
import { Coins } from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";

type CreditProps = {
  value?: number | null;
  className?: string;
};

const Credit: React.FC<CreditProps> = ({ value, className }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [localValue, setLocalValue] = React.useState<number | null>(
    value ?? null
  );
  const [isLoading, setIsLoading] = React.useState<boolean>(
    value === undefined
  );
  const [error, setError] = React.useState<string>("");

  // Self-fetch only when value is not provided via props
  React.useEffect(() => {
    let isMounted = true;
    const fetchCredits = async () => {
      try {
        setIsLoading(true);
        setError("");
        const token = await getToken();
        const baseUrl = import.meta.env.VITE_BASE_URL;
        const resp = await fetch(`${baseUrl}/api/credits/getUserCredits`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ clerkId: user?.id }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const total =
          typeof data === "object" && data !== null
            ? (data.total as number | undefined)
            : undefined;
        if (isMounted) {
          setLocalValue(typeof total === "number" ? total : 0);
        }
      } catch (e) {
        if (isMounted) setError("Failed to fetch credits");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (value === undefined) {
      fetchCredits();
    } else {
      setLocalValue(value ?? null);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [value, getToken]);

  return (
    <div
      className={`flex items-center gap-2 px-3 h-8 rounded-md bg-green-50 text-strong  transition-colors ${
        className || ""
      }`}
      title={error || "Available credits"}
    >
      <Coins className="w-5 h-5 text-yellow-500 " />
      {isLoading ? (
        <span className="text-xs text-muted">Loading...</span>
      ) : (
        <span className="text-xl font-medium ">{localValue ?? 0} </span>
      )}
    </div>
  );
};

export default Credit;
