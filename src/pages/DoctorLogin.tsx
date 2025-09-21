import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Mail, Lock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/supabase/supabaseClient"; // or your correct import

const DoctorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, user } = useAuth();

  useEffect(() => {
    const checkIfDoctor = async () => {
      if (!user) return;

      const { data: doctorData, error } = await supabase
        .from("doctors")
        .select("id")
        .eq("id", user.id)
        .single();

      if (doctorData && !error) {
        navigate("/doctor/dashboard");
      } else {
        // Optional: sign out the user if not a doctor
        // await signOut();
        alert("Access denied. You are not a doctor.");
      }
    };

    checkIfDoctor();
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setIsLoading(false);
      return;
    }

    // ✅ Check if this user is in doctors table
    const { data: doctorData, error: doctorError } = await supabase
      .from("doctors")
      .select("id")
      .eq("id", (await supabase.auth.getUser()).data.user.id)
      .single();

    if (doctorError || !doctorData) {
      alert("Access denied: You are not registered as a doctor.");
      setIsLoading(false);
      return;
    }

    navigate("/doctor/dashboard");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900">
            <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span>MediCloud</span>
          </Link>
          <p className="text-gray-600 mt-2">Doctor Portal</p>
        </div>

        <Card className="card-hover">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Doctor Login</CardTitle>
            <CardDescription>
              Access your patient management dashboard
            </CardDescription>
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
                <Link to="/doctor/register" className="text-green-600 hover:underline font-medium">
                  Register here
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
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