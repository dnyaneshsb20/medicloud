import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { PortalCard } from "@/components/ui/portal-card";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { User, Stethoscope, Calendar, Shield, Users, Clock, Heart } from "lucide-react";

type ViewMode = 'landing' | 'login' | 'register';
type UserRole = 'patient' | 'doctor' | 'pharmacist';

export default function Landing() {
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');

  const handleLogin = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentView('login');
  };

  const handleRegister = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentView('register');
  };

  const handleBack = () => {
    setCurrentView('landing');
  };

  if (currentView === 'login') {
    return <LoginForm role={selectedRole} onBack={handleBack} />;
  }

  if (currentView === 'register') {
    return <RegisterForm role={selectedRole} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header 
        title="MediCloud" 
        subtitle="Patient Record System" 
      />
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Healthcare Management System
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Streamline patient care with our comprehensive cloud-based platform. Secure, 
            efficient, and designed for modern healthcare workflows.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <PortalCard
            title="Patient Portal"
            description="Book appointments, view records, and manage your healthcare journey"
            icon={<User className="w-8 h-8 text-white" />}
            loginVariant="patient"
            onLogin={() => handleLogin('patient')}
            onRegister={() => handleRegister('patient')}
          />
          
          <PortalCard
            title="Doctor Portal"
            description="Manage patients, view appointments, and provide quality care"
            icon={<Stethoscope className="w-8 h-8 text-white" />}
            loginVariant="doctor"
            onLogin={() => handleLogin('doctor')}
            onRegister={() => handleRegister('doctor')}
          />
          
          <PortalCard
            title="Pharmacist"
            description="View prescriptions and assist patients with medicines"
            icon={<Calendar className="w-8 h-8 text-white" />}
            loginVariant="pharmacist"
            onLogin={() => handleLogin('pharmacist')}
            onRegister={() => handleRegister('pharmacist')}
            showRegister={true}
          />
        </div>

        {/* Features Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Why Choose MediCloud?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-medical-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Secure</h3>
              <p className="text-muted-foreground">HIPAA compliant with end-to-end encryption</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-medical-green rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Role-Based</h3>
              <p className="text-muted-foreground">Tailored access for different user types</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-medical-purple rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Efficient</h3>
              <p className="text-muted-foreground">Streamlined appointment management</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-medical-blue-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Patient-Centered</h3>
              <p className="text-muted-foreground">Focus on improving patient outcomes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t mt-16">
        <div className="container mx-auto px-6 py-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-medical rounded-full flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="text-xl font-bold">MediCloud</span>
          </div>
          <p className="text-muted-foreground">
            © 2025 Dnyanesh Badave | MediCloud
          </p>
        </div>
      </footer>
    </div>
  );
}