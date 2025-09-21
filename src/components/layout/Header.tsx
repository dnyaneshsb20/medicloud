// src/components/common/Header.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { LogOut, User as UserIcon } from "lucide-react";
import { supabase } from "@/supabase/supabaseClient";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
}

type Profile = {
  id?: string;
  full_name?: string;
  role?: "patient" | "doctor" | "pharmacist" | string;
  email?: string;
};

export const Header = ({ title, subtitle, showLogout = false }: HeaderProps) => {
  const { user, signOut } = useAuth(); // user may be undefined or partial
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // helpers to get fields from various possible user shapes
  const getEmailFromUser = () =>
    // common shapes: user.email || user.user?.email || user.user_metadata?.email
    (user as any)?.email ||
    (user as any)?.user?.email ||
    (user as any)?.user_metadata?.email ||
    "";

  const getIdFromUser = () =>
    (user as any)?.id || (user as any)?.user?.id || (user as any)?.sub || "";

  useEffect(() => {
    if (!user?.email) return;

    const fetchProfile = async () => {
      // Try doctors
      const { data: doctor } = await supabase
        .from("doctors")
        .select("full_name")
        .eq("email", user.email)
        .maybeSingle();

      if (doctor) {
        setProfile({ full_name: doctor.full_name, role: "doctor" });
        return;
      }

      // Try patients
      const { data: patient } = await supabase
        .from("patients")
        .select("full_name")
        .eq("email", user.email)
        .maybeSingle();

      if (patient) {
        setProfile({ full_name: patient.full_name, role: "patient" });
        return;
      }

      // Try pharmacists
      const { data: pharmacist } = await supabase
        .from("pharmacists")
        .select("full_name")
        .eq("email", user.email)
        .maybeSingle();

      if (pharmacist) {
        setProfile({ full_name: pharmacist.full_name, role: "pharmacist" });
        return;
      }

      // fallback
      setProfile({ full_name: user.email, role: "patient" });
    };

    fetchProfile();
  }, [user]);

  // Determine gradient by role
  const roleName = profile?.role || "patient";
  const roleGradient =
    roleName === "doctor"
      ? "bg-gradient-to-r from-green-500 to-emerald-600"
      : roleName === "pharmacist"
        ? "bg-gradient-to-r from-purple-500 to-indigo-600"
        : "bg-gradient-to-r from-blue-500 to-blue-600";

  // Display name and prefix for doctor
  const rawName = profile?.full_name || getEmailFromUser() || "User";
  const displayName = profile?.role === "doctor" ? `Dr. ${profile.full_name}` : profile?.full_name;


  return (
    <header className="bg-card border-b shadow-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center space-x-3">
            <div className={`${roleGradient} text-white rounded-lg px-2 py-1 font-bold text-xl`}>
              M
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-foreground">MediCloud</span>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          {showLogout && user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <UserIcon className="w-4 h-4" />
                <span className="text-bold">{loadingProfile ? "Loading..." : `Welcome, ${displayName}`}</span>
              </div>
              <Button variant="outline" onClick={() => signOut && signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
