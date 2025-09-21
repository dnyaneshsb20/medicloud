import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Stethoscope } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/supabase/supabaseClient";
import { toast } from "sonner"; // ✅ import toast

const DoctorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Sign in using Supabase
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      toast.error("Invalid email or password!", {
        style: { background: "#fee2e2", color: "#b91c1c" }, // light red bg, dark red text
      });
      setIsLoading(false);
      return;
    }

    // Check if doctor exists in doctors table
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id")
      .eq("email", email)
      .single();

    if (doctorError || !doctor) {
      toast.error("You are not registered as a Doctor!", {
        style: { background: "#fee2e2", color: "#b91c1c" },
      });
      setIsLoading(false);
      return;
    }

    // Success → redirect
    toast.success("Login successful! Redirecting...", {
      style: { background: "#dcfce7", color: "#166534" }, // green success toast
    });
    navigate("/doctor/dashboard");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900"
          >
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg px-2 py-1 font-bold text-2xl">
              M
            </div>
            <span className="text-3xl">MediCloud</span>
          </Link>
        </div>

        <Card className="card-hover">
          <CardHeader className="text-center">
            <div className="flex items-center gap-3 justify-center">
              <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <CardTitle>Doctor Login</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Need an account?{" "}
                <Link
                  to="/doctor/register"
                  className="text-green-600 hover:underline font-medium"
                >
                  Register here
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorLogin;
