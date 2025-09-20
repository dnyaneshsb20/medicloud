import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "./AuthProvider";
import { ArrowLeft, Mail, Lock } from "lucide-react";

interface LoginFormProps {
  role: 'patient' | 'doctor' | 'pharmacist';
  onBack: () => void;
}

export const LoginForm = ({ role, onBack }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      // Redirect will be handled by the auth provider based on user role
    }
    
    setLoading(false);
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'patient':
        return 'Patient Portal Login';
      case 'doctor':
        return 'Doctor Portal Login';
      case 'pharmacist':
        return 'Pharmacist Portal Login';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'patient':
        return 'text-medical-blue';
      case 'doctor':
        return 'text-medical-green';
      case 'pharmacist':
        return 'text-medical-purple';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-medical">
        <CardHeader className="space-y-4">
          <Button
            variant="ghost"
            className="w-fit p-0 h-auto"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="text-center">
            <CardTitle className={`text-2xl font-bold ${getRoleColor()}`}>
              {getRoleTitle()}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Enter your credentials to access your account
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
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
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
              className="w-full bg-gradient-medical text-white font-semibold"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};