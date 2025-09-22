
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Calendar, Shield, Stethoscope, BriefcaseMedical } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white rounded-lg px-2 py-1 font-bold text-2xl">M</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MediCloud</h1>
                <p className="text-sm text-gray-600">Patient Record System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-5 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-5">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
              Healthcare Management System
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Streamline patient care with our comprehensive cloud-based platform.
            Secure, efficient, and designed for modern healthcare workflows.
          </p>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Patient Card */}
            <Card className="card-hover group cursor-pointer">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Patient Portal</CardTitle>
                <CardDescription className="text-base">
                  Book appointments, view records, and manage your healthcare journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/patient/login">
                  <Button className="w-full btn-medical bg-gradient-to-r from-blue-500 to-blue-600">Login</Button>
                </Link>
                <Link to="/patient/register">
                  <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 mt-2">
                    Register as Patient
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Doctor Card */}
            <Card className="card-hover group cursor-pointer">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:from-green-600 group-hover:to-emerald-700 transition-all duration-300">
                  {/* <Heart className="h-8 w-8 text-white" /> */}
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Doctor Portal</CardTitle>
                <CardDescription className="text-base">
                  Manage patients, view appointments, and provide quality care
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/doctor/login">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800">
                    Login
                  </Button>
                </Link>
                <Link to="/doctor/register">
                  <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50 mt-2">
                    Register as Doctor
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pharmacist Card */}
            <Card className="card-hover group cursor-pointer h-full flex flex-col justify-between">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center group-hover:from-purple-600 group-hover:to-indigo-700 transition-all duration-300">
                  <BriefcaseMedical className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Pharmacist</CardTitle>
                <CardDescription className="text-base">
                  View prescriptions and assist patients with medicines
                </CardDescription>
              </CardHeader>

              <CardContent className="mt-auto space-y-3">
                <Link to="/pharmacist/login">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800">
                    Login
                  </Button>
                </Link>
                <Link to="/pharmacist/register">
                  <Button
                    variant="outline"
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 mt-2"
                  >
                    Register as Pharmacist
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-7">
            Why Choose MediCloud?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Secure</h4>
              <p className="text-gray-600 text-sm">HIPAA compliant with end-to-end encryption</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Role-Based</h4>
              <p className="text-gray-600 text-sm">Tailored access for different user types</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Efficient</h4>
              <p className="text-gray-600 text-sm">Streamlined appointment management</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Patient-Centered</h4>
              <p className="text-gray-600 text-sm">Focus on improving patient outcomes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 text-center">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="bg-blue-600 text-white rounded-lg px-2 py-1 font-bold text-sm">M</div>
            <span className="text-xl font-bold">MediCloud</span>
          </div>
        </div>
        &copy; 2025 Dnyanesh Badave | MediCloud
      </footer>
    </div>
  );
};

export default Index;
