import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, Clock, FileText, User, Stethoscope } from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  symptoms: string;
  patient_id: string;
  patients?: {
    full_name: string;
    phone: string;
    date_of_birth: string;
  };
}

interface DoctorProfile {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  specialization: string;
  license_number: string;
  consultation_fee: number;
  available_from: string;
  available_to: string;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'patients' | 'profile'>('dashboard');

  useEffect(() => {
    if (user) {
      fetchDoctorData();
    }
  }, [user]);

  const fetchDoctorData = async () => {
    if (!user) return;
    
    try {
      // Fetch doctor profile
      const { data: doctorData, error: profileError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(doctorData);

      // Fetch appointments with patient info
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            full_name,
            phone,
            date_of_birth
          )
        `)
        .eq('doctor_id', user.id)
        .order('appointment_date', { ascending: true });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

    } catch (error: any) {
      console.error('Error fetching doctor data:', error);
      toast.error("Failed to load doctor data");
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

  const todayAppointments = appointments.filter(
    apt => apt.appointment_date === new Date().toISOString().split('T')[0]
  );

  const waitingPatients = appointments.filter(
    apt => apt.status === 'waiting' || apt.status === 'confirmed'
  );

  const completedToday = todayAppointments.filter(
    apt => apt.status === 'completed'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-green mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="MediCloud" 
        subtitle="Doctor Portal"
        showLogout={true}
      />
      
      <div className="container mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {getGreeting()}, Dr. {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">Here's your practice overview for today</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            className={activeTab === 'dashboard' ? 'bg-medical-green text-white' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'appointments' ? 'default' : 'ghost'}
            className={activeTab === 'appointments' ? 'bg-medical-green text-white' : ''}
            onClick={() => setActiveTab('appointments')}
          >
            Today's Appointments
          </Button>
          <Button
            variant={activeTab === 'patients' ? 'default' : 'ghost'}
            className={activeTab === 'patients' ? 'bg-medical-green text-white' : ''}
            onClick={() => setActiveTab('patients')}
          >
            All Patients
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            className={activeTab === 'profile' ? 'bg-medical-green text-white' : ''}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </Button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="w-5 h-5 mr-2 text-medical-blue" />
                    Today's Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-medical-blue">
                    {todayAppointments.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="w-5 h-5 mr-2 text-medical-orange" />
                    Waiting Patients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-medical-orange">
                    {waitingPatients.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Users className="w-5 h-5 mr-2 text-medical-green" />
                    Total Patients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-medical-green">
                    {new Set(appointments.map(apt => apt.patient_id)).size}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="w-5 h-5 mr-2 text-medical-purple" />
                    Completed Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-medical-purple">
                    {completedToday.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Today's Schedule
                </CardTitle>
                <p className="text-muted-foreground">
                  Manage your appointments and patient consultations
                </p>
              </CardHeader>
              <CardContent>
                {todayAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-medical-green/10 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-medical-green" />
                          </div>
                          <div>
                            <p className="font-semibold">{appointment.patients?.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.appointment_time}
                            </p>
                            {appointment.symptoms && (
                              <p className="text-sm text-muted-foreground">
                                Symptoms: {appointment.symptoms}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          {appointment.status === 'waiting' && (
                            <div className="space-x-2">
                              <Button variant="outline" size="sm">
                                View Patient
                              </Button>
                              <Button 
                                size="sm"
                                className="bg-medical-blue hover:bg-medical-blue-light text-white"
                              >
                                Start Consultation
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">No appointments scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other tabs content would go here */}
        {activeTab === 'profile' && profile && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Doctor Profile</h2>
            <p className="text-muted-foreground">Your professional information and credentials</p>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-semibold">{profile.full_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{profile.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold">{profile.mobile_number || 'Not provided'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Specialization</p>
                    <p className="font-semibold">{profile.specialization}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">License Number</p>
                    <p className="font-semibold">{profile.license_number}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Consultation Fee</p>
                    <p className="font-semibold">₹{profile.consultation_fee}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Available Hours</p>
                  <p className="font-semibold">
                    {profile.available_from} - {profile.available_to}
                  </p>
                </div>

                <div className="pt-6">
                  <Button className="bg-medical-green hover:bg-medical-green-light text-white">
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
