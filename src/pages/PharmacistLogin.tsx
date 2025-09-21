import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pill, Mail, Lock } from "lucide-react"; // Pill icon for pharmacist
import { useAuth } from "@/components/auth/AuthProvider";
// import { supabase } from "@/supabase/supabaseClient"; // Not needed if no role checks

const PharmacistLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();
  // const { user } = useAuth(); // user role checking removed for now

  // 🔹 useEffect with role check removed for now
  // useEffect(() => { ... }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setIsLoading(false);
      return;
    }

    // 🔹 Role check removed for now
    // Future: verify user.id exists in pharmacists table

    navigate("/pharmacist/dashboard");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg px-2 py-1 font-bold text-2xl">
              M
            </div>
            <span className="text-3xl">MediCloud</span>
          </Link>
        </div>

        <Card className="card-hover">
          <CardHeader className="text-center">
            <div className="flex items-center gap-3 justify-center">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <CardTitle>Pharmacist Login</CardTitle>
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
                    placeholder="pharmacist@example.com"
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
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Need an account?{" "}
                <Link to="/pharmacist/register" className="text-purple-600 hover:underline font-medium">
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

export default PharmacistLogin;
