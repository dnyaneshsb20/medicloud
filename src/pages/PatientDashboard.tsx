import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, FileText, User, Clock, MapPin, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import AppointmentBooking from "./AppointmentBooking"; // adjust the path as needed
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  medical_history?: string;
  role: "patient" | "doctor" | "pharmacist";
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'profile'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({} as UserProfile);
  const [showModal, setShowModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [appointmentRecord, setAppointmentRecord] = useState<any>(null);
  const [isRecordLoading, setIsRecordLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchPatientAndData = async () => {
      // Check if the user is a patient
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!patientData) {
        // fetch role from doctors table
        const { data: doctorData } = await supabase
          .from("doctors")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (doctorData) {
          setProfile({ id: user.id, full_name: doctorData.full_name, role: "doctor" });
        } else {
          // fetch role from pharmacists table
          const { data: pharmacistData } = await supabase
            .from("pharmacists")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          if (pharmacistData) {
            setProfile({ id: user.id, full_name: pharmacistData.full_name, role: "pharmacist" });
          }
        }

        setLoading(false);
        return;
      }

      setProfile({ ...patientData, role: "patient" }); // add role to the state type

      // Fetch patient-specific appointments, records, or other data here
      await fetchPatientData(); // your existing function

      setLoading(false);
    };

    fetchPatientAndData();
  }, [user]);

  const fetchPatientData = async () => {
    if (!user) return;

    try {
      // 🔹 Fetch patient profile
      // (Future Role Check could go here to confirm `user.id` belongs to a patient)
      const { data: patientData, error: profileError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', user.id) // <-- relies only on logged-in user id
        .single();

      if (profileError) throw profileError;
      setProfile({ ...patientData, role: "patient" });

      // 🔹 Fetch appointments with doctor info
      // (Future Role Check could go here to confirm only patients access their appointments)
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors (
            full_name,
            specialization
          )
        `)
        .eq('patient_id', user.id) // <-- again tied to logged-in user id
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    else if (hour < 18) return "Good Afternoon";
    else return "Good Evening";
  };

  const handleViewPrescription = async (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsRecordLoading(true);
    setIsModalOpen(true);

    try {
      const { data, error } = await supabase
        .from("medical_records")
        .select("*")
        .eq("appointment_id", appointmentId)
        .single(); // fetch only one record for this appointment

      if (error) {
        console.error(error);
        setAppointmentRecord(null);
      } else {
        setAppointmentRecord(data);
      }
    } catch (err) {
      console.error(err);
      setAppointmentRecord(null);
    } finally {
      setIsRecordLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <Header
        title="Patient Dashboard"
        subtitle={`Welcome back, ${profile?.full_name}`}
        showLogout={true}
      />

      <div className="container mx-auto px-6 py-8">
        {/* Greeting for Patient */}
        <div className="mb-8">
          {profile?.role === "patient" ? (
            <>
              <h1 className="text-3xl font-bold text-foreground">
                {getGreeting()}! {profile.full_name}.
              </h1>
              <p className="text-muted-foreground">Here's your health overview for today</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-foreground">
                You are not a patient.
              </h1>
              <p className="text-muted-foreground">
                Please log in as {profile?.role || "doctor/pharmacist"} to get the details.
              </p>
            </>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 w-full mb-8 bg-muted p-1 rounded-lg bg-white">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            className={`flex-1 ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'appointments' ? 'default' : 'ghost'}
            className={`flex-1 ${activeTab === 'appointments' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            className={`flex-1 ${activeTab === 'profile' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700' : ''}`}
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
              <Button
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 text-white"
                onClick={() => setShowModal(true)}
              >
                Book New Appointment
              </Button>
              {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg w-full max-w-2xl h-[600px] relative flex flex-col">
                    {/* Close button */}
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                      onClick={() => setShowModal(false)}
                    >
                      X
                    </button>

                    {/* Scrollable content */}
                    <div className="overflow-y-auto mt-6">
                      <AppointmentBooking />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Card className="shadow-card">
              <CardContent className="p-6">
                {appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-6 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-medical-blue/10 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-medical-blue" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">
                              Dr. {appointment.doctors?.full_name}
                            </p>
                            <p className="text-muted-foreground">
                              {appointment.doctors?.specialization}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(
                                appointment.appointment_date
                              ).toLocaleDateString()}{" "}
                              at {appointment.appointment_time}
                            </p>
                            {appointment.symptoms && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Symptoms: {appointment.symptoms}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-x-1">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          {appointment.status === "consulted" && (
                            <Button
                              variant="outline"
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                              onClick={() => handleViewPrescription(appointment.id)}
                            >
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
                    <Button className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 text-white">
                      Book Your First Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ✅ Global Modal (moved outside of appointments loop) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Appointment Prescription</DialogTitle>
                </DialogHeader>

                {isRecordLoading ? (
                  <p className="text-center text-gray-500">Loading record...</p>
                ) : !appointmentRecord ? (
                  <p className="text-center text-gray-500">
                    No prescription found for this appointment.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    <Card className="p-4">
                      <p>
                        <strong>Diagnosis:</strong> {appointmentRecord.diagnosis || "N/A"}
                      </p>
                      <p>
                        <strong>Suggestions:</strong>{" "}
                        {appointmentRecord.suggestions || "N/A"}
                      </p>
                      <p>
                        <strong>Follow-up Date:</strong>{" "}
                        {appointmentRecord.follow_up_date || "N/A"}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(appointmentRecord.created_at).toLocaleDateString()}
                      </p>
                      {appointmentRecord.medicines && (
                        <div className="mt-2">
                          <strong>Medicines:</strong>
                          <table className="w-full mt-1 border text-center">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="p-2 border">Name</th>
                                <th className="p-2 border">Dosage</th>
                                <th className="p-2 border">Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(appointmentRecord.medicines) &&
                                appointmentRecord.medicines.map(
                                  (med: any, index: number) => (
                                    <tr key={index}>
                                      <td className="p-2 border">{med.name}</td>
                                      <td className="p-2 border">{med.dosage}</td>
                                      <td className="p-2 border">{med.duration}</td>
                                    </tr>
                                  )
                                )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && profile && (
          <div className="space-y-6 w-full">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
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
                      <p className="font-semibold">{profile.full_name}</p>
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
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    ) : (
                      <p className="font-semibold">{profile.phone || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.date_of_birth || ''}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      />
                    ) : (
                      <p className="font-semibold">
                        {profile.date_of_birth
                          ? new Date(profile.date_of_birth).toLocaleDateString()
                          : 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    {isEditing ? (
                      <select
                        className="input input-bordered w-full"
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <p className="font-semibold capitalize">{profile.gender || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    {isEditing ? (
                      <Input
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    ) : (
                      <p className="font-semibold">{profile.address || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <p className="text-sm text-muted-foreground">Emergency Contact</p>
                    {isEditing ? (
                      <Input
                        value={formData.emergency_contact || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, emergency_contact: e.target.value })
                        }
                      />
                    ) : (
                      <p className="font-semibold">{profile.emergency_contact || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Medical History */}
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Medical History</p>
                    {isEditing ? (
                      <textarea
                        className="input input-bordered w-full"
                        value={formData.medical_history || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, medical_history: e.target.value })
                        }
                      />
                    ) : (
                      <p className="font-semibold">{profile.medical_history || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {/* Edit / Update Button */}
                <div className="pt-3">
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                    onClick={async () => {
                      if (isEditing) {
                        // Update patient details in Supabase
                        const { role, ...updateData } = formData;
                        const { error } = await supabase
                          .from("patients")
                          .update(updateData)
                          .eq("id", profile.id);

                        if (!error) {
                          // Refresh profile data
                          setProfile({ ...profile, ...updateData });
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