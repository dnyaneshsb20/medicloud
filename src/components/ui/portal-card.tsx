import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PortalCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  loginVariant: "patient" | "doctor" | "pharmacist";
  onLogin: () => void;
  onRegister?: () => void;
  showRegister?: boolean;
}

export const PortalCard = ({
  title,
  description,
  icon,
  loginVariant,
  onLogin,
  onRegister,
  showRegister = true
}: PortalCardProps) => {
  const getVariantClasses = () => {
    switch (loginVariant) {
      case "patient":
        return "bg-medical-blue hover:bg-medical-blue-light";
      case "doctor":
        return "bg-medical-green hover:bg-medical-green-light";
      case "pharmacist":
        return "bg-medical-purple hover:bg-medical-purple-light";
      default:
        return "bg-primary hover:bg-primary/90";
    }
  };

  const getRegisterVariant = () => {
    switch (loginVariant) {
      case "patient":
        return "text-medical-blue hover:text-medical-blue-light";
      case "doctor":
        return "text-medical-green hover:text-medical-green-light";
      case "pharmacist":
        return "text-medical-purple hover:text-medical-purple-light";
      default:
        return "text-primary hover:text-primary/90";
    }
  };

  return (
    <Card className="p-8 text-center hover:shadow-medical transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
      <div className="mb-6 flex justify-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getVariantClasses()}`}>
          {icon}
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground mb-6 leading-relaxed">{description}</p>
      
      <div className="space-y-3">
        <Button
          className={`w-full ${getVariantClasses()} text-white border-0 font-semibold py-3 transition-all duration-300`}
          onClick={onLogin}
        >
          Login
        </Button>
        
        {showRegister && onRegister && (
          <Button
            variant="ghost"
            className={`w-full ${getRegisterVariant()} font-medium hover:bg-transparent`}
            onClick={onRegister}
          >
            Register as {title.split(' ')[0]}
          </Button>
        )}
      </div>
    </Card>
  );
};