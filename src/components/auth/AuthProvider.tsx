import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'patient' | 'doctor' | 'pharmacist' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | 'pharmacist' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Determine user role based on which table they exist in
          setTimeout(() => {
            determineUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          determineUserRole(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const determineUserRole = async (userId: string) => {
    try {
      // Check if user exists in patients table
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (patient) {
        setUserRole('patient');
        return;
      }

      // Check if user exists in doctors table
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (doctor) {
        setUserRole('doctor');
        return;
      }

      // Check if user exists in pharmacists table
      const { data: pharmacist } = await supabase
        .from('pharmacists')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (pharmacist) {
        setUserRole('pharmacist');
        return;
      }

      setUserRole(null);
    } catch (error) {
      console.error('Error determining user role:', error);
      setUserRole(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    }

    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      toast.error(error.message);
      return { error };
    }

    if (data.user) {
      // Insert user data into appropriate table based on role
      try {
        if (userData.role === 'patient') {
          await supabase.from('patients').insert({
            id: data.user.id,
            full_name: userData.full_name,
            email: email,
            phone: userData.phone,
            date_of_birth: userData.date_of_birth,
            gender: userData.gender,
            address: userData.address,
            emergency_contact: userData.emergency_contact,
            medical_history: userData.medical_history
          });
        } else if (userData.role === 'doctor') {
          await supabase.from('doctors').insert({
            id: data.user.id,
            full_name: userData.full_name,
            email: email,
            mobile_number: userData.phone,
            specialization: userData.specialization,
            license_number: userData.license_number,
            consultation_fee: userData.consultation_fee,
            available_from: userData.available_from,
            available_to: userData.available_to
          });
        } else if (userData.role === 'pharmacist') {
          await supabase.from('pharmacists').insert({
            id: data.user.id,
            full_name: userData.full_name,
            email: email,
            phone: userData.phone
          });
        }
        
        toast.success("Registration successful! Please check your email for verification.");
      } catch (insertError) {
        console.error('Error inserting user data:', insertError);
        toast.error("Registration failed. Please try again.");
        return { error: insertError };
      }
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed out successfully");
    }
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};