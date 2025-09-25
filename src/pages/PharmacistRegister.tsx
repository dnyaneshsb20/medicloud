import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/supabase/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pill } from "lucide-react";
import toast from "react-hot-toast";

const PharmacistRegister = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "pharmacist", full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
    }
    toast.success("Login successful! Redirecting...", {
      style: { background: "#dcfce7", color: "#166534" }, // green success toast
    });
    setTimeout(() => {
      navigate("/pharmacist/login");
    }, 1500);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 flex items-center justify-center min-h-screen bg-gray-100">
      {/* Fixed width wrapper for header + card */}
      <div className="w-[400px]">
        {/* Centered MediCloud header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900"
          >
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg px-2 py-1 font-bold text-2xl">
              M
            </div>
            <span className="text-3xl">MediCloud</span>
          </Link>
        </div>

        {/* Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 justify-center">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <CardTitle>Pharmacist Register</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white"
              >
                Register
              </Button>

              <p className="text-sm text-center mt-2">
                Already have an account?{" "}
                <Link
                  to="/pharmacist/login"
                  className="text-blue-600 hover:underline"
                >
                  Sign In
                </Link>
              </p>
              <div className="mt-4 text-center">
                <Link
                  to="/"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back to Home
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PharmacistRegister;