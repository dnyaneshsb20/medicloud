import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, Clock, FileText, User, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

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

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  documents_count: number;
  last_uploaded?: string;
}


export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'patients' | 'profile'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    mobile_number: "",
    specialization: "",
    license_number: "",
    consultation_fee: 0,
    available_from: "",
    available_to: "",
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDoctorData(); // your existing doctor profile fetch

      // Fetch patients for this doctor
      const fetchPatients = async () => {
        setIsLoadingPatients(true);

        const { data, error } = await supabase
          .from("medical_records")
          .select(`
      patient_id,
      patients (
        id,
        full_name,
        email,
        phone,
        date_of_birth,
        gender
      ),
      created_at
    `)
          .eq("doctor_id", user.id);

        if (error) {
          console.error("Error fetching patients:", error);
        } else {
          const patientMap: Record<string, any> = {};
          data?.forEach((record: any) => {
            const p = record.patients;
            if (!p) return;

            if (!patientMap[p.id]) {
              patientMap[p.id] = {
                ...p,
                records_count: 1,
                last_recorded: record.created_at,
              };
            } else {
              patientMap[p.id].records_count += 1;
              if (record.created_at > patientMap[p.id].last_recorded) {
                patientMap[p.id].last_recorded = record.created_at;
              }
            }
          });

          setPatients(Object.values(patientMap)); // update state
        }

        setIsLoadingPatients(false);
      };

      fetchPatients();
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
  // Inside your component, above the return()
  const viewPatientDetails = (patientId: string) => {
    // For now, just log it
    console.log("View details for patient:", patientId);

    // TODO: You can open a modal or navigate to a patient detail page
  };


  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Header
        title="MediCloud"
        subtitle="Doctor Portal"
        showLogout={true}
      />

      <div className="container mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {getGreeting()}! Dr. {profile?.full_name}.
          </h1>
          <p className="text-muted-foreground">Here's your practice overview for today</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg w-full bg-white">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            className={`flex-1 ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'appointments' ? 'default' : 'ghost'}
            className={`flex-1 ${activeTab === 'appointments' ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Today's Appointments
          </Button>
          <Button
            variant={activeTab === 'patients' ? 'default' : 'ghost'}
            className={`flex-1 ${activeTab === 'patients' ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            All Patients
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            className={`flex-1 ${activeTab === 'profile' ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800' : ''}`}
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

        {/* All Patients Tab */}
        {activeTab === 'patients' && (
          <div className="flex flex-col items-center space-y-6 w-full">
            <h2 className="text-2xl font-bold text-center w-full max-w-5xl">My Patients</h2>

            {isLoadingPatients ? (
              <p>Loading patients...</p>
            ) : patients.length === 0 ? (
              <p>No patients found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl">
                {patients.map((patient) => (
                  <Card key={patient.id} className="shadow-card p-4 flex flex-col justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{patient.full_name}</p>
                      <p className="text-sm text-muted-foreground">Email: {patient.email}</p>
                      <p className="text-sm text-muted-foreground">Phone: {patient.phone}</p>
                      <p className="text-sm text-muted-foreground">DOB: {patient.date_of_birth}</p>
                      <p className="text-sm text-muted-foreground">Gender: {patient.gender}</p>
                    </div>
                    <Button
                      className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => viewPatientDetails(patient.id)}
                    >
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Other tabs content would go here */}
        {activeTab === 'profile' && profile && (
          <div className="space-y-6 w-full">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    {isEditing ? (
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      />
                    ) : (
                      <p className="font-semibold">Dr. {profile.full_name}</p>
                    )}
                  </div>

                  {/* Email (readonly) */}
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{profile.email}</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    {isEditing ? (
                      <Input
                        value={formData.mobile_number}
                        onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                      />
                    ) : (
                      <p className="font-semibold">{profile.mobile_number || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Specialization */}
                  <div>
                    <p className="text-sm text-muted-foreground">Specialization</p>
                    {isEditing ? (
                      <Input
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      />
                    ) : (
                      <p className="font-semibold">{profile.specialization}</p>
                    )}
                  </div>

                  {/* License Number */}
                  <div>
                    <p className="text-sm text-muted-foreground">License Number</p>
                    {isEditing ? (
                      <Input
                        value={formData.license_number}
                        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      />
                    ) : (
                      <p className="font-semibold">{profile.license_number}</p>
                    )}
                  </div>

                  {/* Consultation Fee */}
                  <div>
                    <p className="text-sm text-muted-foreground">Consultation Fee</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={formData.consultation_fee}
                        onChange={(e) => setFormData({ ...formData, consultation_fee: Number(e.target.value) })}
                      />
                    ) : (
                      <p className="font-semibold">₹{profile.consultation_fee}</p>
                    )}
                  </div>
                </div>

                {/* Available Hours */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Available Timings</p>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={formData.available_from}
                        onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                      />
                      <span className="self-center">-</span>
                      <Input
                        type="time"
                        value={formData.available_to}
                        onChange={(e) => setFormData({ ...formData, available_to: e.target.value })}
                      />
                    </div>
                  ) : (
                    <p className="font-semibold">
                      {profile.available_from} - {profile.available_to}
                    </p>
                  )}
                </div>

                {/* Edit / Update Button */}
                <div className="pt-6">
                  <Button
                    className="bg-medical-green hover:bg-medical-green-light text-white"
                    onClick={async () => {
                      if (isEditing) {
                        // Update doctor details in Supabase
                        const { error } = await supabase
                          .from("doctors")
                          .update({ ...formData })
                          .eq("id", profile.id);

                        if (!error) {
                          // Refresh profile data
                          setProfile({ ...profile, ...formData });
                          setIsEditing(false);
                        } else {
                          alert("Error updating profile: " + error.message);
                        }
                      } else {
                        // Enable edit mode
                        setFormData({ ...profile }); // populate formData
                        setIsEditing(true);
                      }
                    }}
                  >
                    {isEditing ? "Update Details" : "Edit Profile"}
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
