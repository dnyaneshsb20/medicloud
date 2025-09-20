import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, FileText, User, Clock, MapPin, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  symptoms: string;
  doctor_id: string;
  doctors?: {
    full_name: string;
    specialization: string;
  };
}

interface PatientProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  emergency_contact: string;
  medical_history: string;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'profile'>('dashboard');

  useEffect(() => {
    if (user) {
      fetchPatientData();
    }
  }, [user]);

  const fetchPatientData = async () => {
    if (!user) return;
    
    try {
      // Fetch patient profile
      const { data: patientData, error: profileError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(patientData);

      // Fetch appointments with doctor info
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors (
            full_name,
            specialization
          )
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      toast.error("Failed to load patient data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-medical-green text-white';
      case 'completed':
        return 'bg-medical-blue text-white';
      case 'cancelled':
        return 'bg-destructive text-white';
      default:
        return 'bg-medical-orange text-white';
    }
  };

  const upcomingAppointments = appointments.filter(
    apt => apt.status === 'confirmed' || apt.status === 'waiting'
  );

  const recentAppointments = appointments
    .filter(apt => apt.status === 'completed')
    .slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Patient Dashboard" 
        subtitle={`Welcome back, ${profile?.full_name}`}
        showLogout={true}
      />
      
      <div className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            className={activeTab === 'dashboard' ? 'bg-medical-blue text-white' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'appointments' ? 'default' : 'ghost'}
            className={activeTab === 'appointments' ? 'bg-medical-blue text-white' : ''}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            className={activeTab === 'profile' ? 'bg-medical-blue text-white' : ''}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </Button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="w-5 h-5 mr-2 text-medical-blue" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-medical-blue">
                    {upcomingAppointments.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="w-5 h-5 mr-2 text-medical-green" />
                    Total Visits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-medical-green">
                    {appointments.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="w-5 h-5 mr-2 text-medical-purple" />
                    Last Visit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {recentAppointments[0] ? 
                      new Date(recentAppointments[0].appointment_date).toLocaleDateString() :
                      'No visits yet'
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Appointments */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {recentAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {recentAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-medical-blue/10 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-medical-blue" />
                          </div>
                          <div>
                            <p className="font-semibold">{appointment.doctors?.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.doctors?.specialization}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No recent appointments found
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Appointments</h2>
              <Button className="bg-medical-blue hover:bg-medical-blue-light text-white">
                Book New Appointment
              </Button>
            </div>

            <Card className="shadow-card">
              <CardContent className="p-6">
                {appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-6 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-medical-blue/10 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-medical-blue" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{appointment.doctors?.full_name}</p>
                            <p className="text-muted-foreground">
                              {appointment.doctors?.specialization}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                            </p>
                            {appointment.symptoms && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Symptoms: {appointment.symptoms}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          {appointment.status === 'completed' && (
                            <Button variant="outline" className="mt-2 block">
                              View Prescription
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">No appointments found</p>
                    <Button className="mt-4 bg-medical-blue hover:bg-medical-blue-light text-white">
                      Book Your First Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && profile && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Profile</h2>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-medical-blue" />
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-semibold">{profile.full_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-medical-blue" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-medical-blue" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-semibold">{profile.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-medical-blue" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-semibold">
                        {profile.date_of_birth ? 
                          new Date(profile.date_of_birth).toLocaleDateString() : 
                          'Not provided'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-medical-blue" />
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-semibold capitalize">{profile.gender || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-medical-blue" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-semibold">{profile.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-medical-orange mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Emergency Contact</p>
                      <p className="font-semibold">{profile.emergency_contact || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {profile.medical_history && (
                  <div className="pt-4 border-t">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-medical-green mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Medical History</p>
                        <p className="font-semibold">{profile.medical_history}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6">
                  <Button className="bg-medical-blue hover:bg-medical-blue-light text-white">
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}