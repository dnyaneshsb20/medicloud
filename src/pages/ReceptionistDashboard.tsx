import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, Clock, Search, User, Phone } from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  symptoms: string;
  patient_id: string;
  doctor_id: string;
  patients?: {
    full_name: string;
    phone: string;
  };
  doctors?: {
    full_name: string;
    specialization: string;
  };
}

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      // Fetch all appointments with patient and doctor info
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            full_name,
            phone
          ),
          doctors (
            full_name,
            specialization
          )
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: newStatus }
            : apt
        )
      );

      toast.success(`Appointment status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast.error("Failed to update appointment status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-medical-green text-white';
      case 'in-consultation':
        return 'bg-medical-blue text-white';
      case 'completed':
        return 'bg-medical-purple text-white';
      case 'cancelled':
        return 'bg-destructive text-white';
      default:
        return 'bg-medical-orange text-white';
    }
  };

  const todayAppointments = appointments.filter(
    apt => apt.appointment_date === new Date().toISOString().split('T')[0]
  );

  const waitingAppointments = todayAppointments.filter(
    apt => apt.status === 'waiting' || apt.status === 'confirmed'
  ).sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

  const filteredAppointments = todayAppointments.filter(apt => 
    apt.patients?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.doctors?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.symptoms?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-purple mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="MediCloud" 
        subtitle="Receptionist Portal"
        showLogout={true}
      />
      
      <div className="container mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Receptionist Dashboard
          </h1>
          <p className="text-muted-foreground">Manage appointments and coordinate patient flow efficiently</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                {waitingAppointments.length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Users className="w-5 h-5 mr-2 text-medical-green" />
                In Consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-medical-green">
                {todayAppointments.filter(apt => apt.status === 'in-consultation').length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Calendar className="w-5 h-5 mr-2 text-medical-purple" />
                Completed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-medical-purple">
                {todayAppointments.filter(apt => apt.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-card mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name, doctor, or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Filter by Date
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Management */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Today's Appointment Queue
            </CardTitle>
            <p className="text-muted-foreground">
              Manage patient flow and appointment status in order of appointment time
            </p>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length > 0 ? (
              <div className="space-y-4">
                {filteredAppointments.map((appointment, index) => (
                  <div key={appointment.id} className="flex items-center justify-between p-6 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-medical-purple/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-medical-purple">
                          {index + 1}
                        </span>
                      </div>
                      
                      <div className="w-12 h-12 bg-medical-blue/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-medical-blue" />
                      </div>
                      
                      <div>
                        <p className="font-semibold text-lg">{appointment.patients?.full_name}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {appointment.appointment_time}
                          </span>
                          {appointment.patients?.phone && (
                            <span className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {appointment.patients.phone}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Dr. {appointment.doctors?.full_name} - {appointment.doctors?.specialization}
                        </p>
                        {appointment.symptoms && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Symptoms: {appointment.symptoms}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status.replace('-', ' ')}
                      </Badge>
                      
                      <div className="flex space-x-2">
                        {appointment.status === 'waiting' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              className="bg-medical-green hover:bg-medical-green-light text-white"
                              onClick={() => updateAppointmentStatus(appointment.id, 'in-consultation')}
                            >
                              Send to Doctor
                            </Button>
                          </>
                        )}
                        
                        {appointment.status === 'confirmed' && (
                          <Button
                            size="sm"
                            className="bg-medical-blue hover:bg-medical-blue-light text-white"
                            onClick={() => updateAppointmentStatus(appointment.id, 'in-consultation')}
                          >
                            Send to Doctor
                          </Button>
                        )}
                        
                        {appointment.status === 'in-consultation' && (
                          <Badge className="bg-medical-blue text-white">
                            With Doctor
                          </Badge>
                        )}
                        
                        {appointment.status === 'completed' && (
                          <Badge className="bg-medical-purple text-white">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchTerm ? 'No appointments match your search' : 'No appointments scheduled for today'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}