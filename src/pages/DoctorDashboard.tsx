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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    email: string;
    gender: string;
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
  role?: "doctor";
}

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  documents_count: number;   // required
  last_uploaded?: string;
  address?: string | null;
  emergency_contact?: string | null;
  medical_history?: string | null;
  created_at?: string | null;
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
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  // Consultation modal
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultPatient, setConsultPatient] = useState<Patient | null>(null);

  // Prescription form state
  const [prescription, setPrescription] = useState({
    diagnosis: "",
    medicines: [{ name: "", dosage: "", duration: "" }],
    suggestions: "",
    followUpDate: "",
  });
  const [medicineOptions, setMedicineOptions] = useState<string[]>([]); // fetch or hardcode your medicine names
  const [dosageOptions, setDosageOptions] = useState<string[]>([]); // example dosages
  useEffect(() => {
    if (!isConsultModalOpen) return; // only fetch when modal opens

    const fetchMedicineAndDosageOptions = async () => {
      try {
        // Fetch medicine names
        const { data: medicinesData, error: medicinesError } = await supabase
          .from("medicine_names")
          .select("name");

        if (medicinesError) {
          console.error("Error fetching medicine names:", medicinesError);
        } else if (medicinesData) {
          setMedicineOptions(medicinesData.map((m: any) => m.name));
        }

        // Fetch dosages
        const { data: dosagesData, error: dosagesError } = await supabase
          .from("dosages")
          .select("*"); // adjust column name if different

        if (dosagesError) {
          console.error("Error fetching dosages:", dosagesError);
        } else if (dosagesData) {
          setDosageOptions(dosagesData.map((d: any) => d.schedule_pattern));
        }

      } catch (err) {
        console.error("Error fetching medicine or dosage options:", err);
      }
    };

    fetchMedicineAndDosageOptions();
  }, [isConsultModalOpen]);



  useEffect(() => {
    if (!user) return;

    const fetchDoctorAndPatients = async () => {
      // Check if the user is a doctor
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!doctorData) {
        toast.error("You are not a doctor");
        setLoading(false);
        return;
      }

      setProfile({ ...doctorData, role: "doctor" });

      // Fetch appointments for this doctor
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
        *,
        patients (
          full_name,
          phone,
          date_of_birth,
          email,
          gender
        )
      `)
        .eq("doctor_id", user.id)
        .order("appointment_date", { ascending: true });

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
        toast.error("Failed to load appointments");
      } else {
        setAppointments(appointmentsData || []);
      }

      // Fetch patients for this doctor
      setIsLoadingPatients(true);

      const { data: recordsData, error: recordsError } = await supabase
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

      if (recordsError) {
        console.error("Error fetching patients:", recordsError);
      } else {
        const patientMap: Record<string, any> = {};
        recordsData?.forEach((record: any) => {
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

        setPatients(Object.values(patientMap));
      }

      setIsLoadingPatients(false);
      setLoading(false);
    };

    fetchDoctorAndPatients();
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
            date_of_birth,
            email,
            gender
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

  // Fetch medical records for a patient
  const fetchPatientRecords = async (patientId: string) => {
    try {
      setIsRecordsLoading(true);
      setSelectedPatientId(patientId);
      setIsModalOpen(true);

      const { data, error } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPatientRecords(data || []);
    } catch (err) {
      console.error("Error fetching patient records:", err);
    } finally {
      setIsRecordsLoading(false);
    }
  };

  const viewPatientInfo = async (patientId: string | null) => {
    if (!patientId) return; // skip if null

    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      setSelectedPatient({ ...data, documents_count: 0 });
      setIsPatientModalOpen(true);
    } catch (err) {
      console.error("Error fetching patient info:", err);
      toast.error("Failed to load patient info");
    }
  };

  const startConsultation = (patient: Patient) => {
    setConsultPatient(patient);

    // Reset the prescription form
    setPrescription({
      diagnosis: "",
      medicines: [{ name: "", dosage: "", duration: "" }],
      suggestions: "",
      followUpDate: "",
    });

    setIsConsultModalOpen(true);
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewPatientInfo(appointment.patient_id)}
                              >
                                View Patient
                              </Button>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800 text-white"
                                onClick={() => startConsultation({
                                  id: appointment.patient_id,
                                  full_name: appointment.patients?.full_name || "",
                                  email: appointment.patients?.email || "",
                                  phone: appointment.patients?.phone || null,
                                  date_of_birth: appointment.patients?.date_of_birth || null,
                                  gender: appointment.patients?.gender || null,
                                  documents_count: 0,
                                })}

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
          <div className="w-full mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-foreground">My Patients</h2>

            {isLoadingPatients ? (
              <p className="text-muted-foreground">Loading patients...</p>
            ) : patients.length === 0 ? (
              <p className="text-muted-foreground">No patients found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg divide-y divide-gray-200 shadow-sm">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="p-3 text-left text-gray-700 font-medium">Name</th>
                      <th className="p-3 text-left text-gray-700 font-medium">Email</th>
                      <th className="p-3 text-left text-gray-700 font-medium">Phone</th>
                      <th className="p-3 text-left text-gray-700 font-medium">Age</th>
                      <th className="p-3 text-left text-gray-700 font-medium">Gender</th>
                      <th className="p-3 text-left text-gray-700 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {patients.map((patient, idx) => {
                      // Calculate age from DOB
                      let age = "N/A";
                      if (patient.date_of_birth) {
                        const dob = new Date(patient.date_of_birth);
                        const diffMs = Date.now() - dob.getTime();
                        const ageDate = new Date(diffMs);
                        age = Math.abs(ageDate.getUTCFullYear() - 1970).toString();
                      }

                      return (
                        <tr
                          key={patient.id}
                          className={idx % 2 === 0 ? "bg-white hover:bg-green-50" : "bg-green-50/30 hover:bg-green-100"}
                        >
                          <td className="p-3 text-gray-800 font-medium">{patient.full_name}</td>
                          <td className="p-3 text-gray-600">{patient.email}</td>
                          <td className="p-3 text-gray-600">{patient.phone}</td>
                          <td className="p-3 text-gray-600">{age}</td>
                          <td className="p-3 text-gray-600">{patient.gender}</td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => fetchPatientRecords(patient.id)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Patient Medical Records</DialogTitle>
          </DialogHeader>

          {isRecordsLoading ? (
            <p className="text-center text-gray-500">Loading records...</p>
          ) : patientRecords.length === 0 ? (
            <p className="text-center text-gray-500">No medical records found.</p>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {patientRecords.map((record) => (
                <Card key={record.id} className="p-4">
                  <p><strong>Diagnosis:</strong> {record.diagnosis || "N/A"}</p>
                  <p><strong>Suggestions:</strong> {record.suggestions || "N/A"}</p>
                  <p><strong>Follow-up Date:</strong> {record.follow_up_date || "N/A"}</p>
                  <p><strong>Date:</strong> {new Date(record.created_at).toLocaleDateString()}</p>
                  {record.medicines && (
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
                          {Array.isArray(record.medicines) &&
                            record.medicines.map((med: any, index: number) => (
                              <tr key={index}>
                                <td className="p-2 border">{med.name}</td>
                                <td className="p-2 border">{med.dosage}</td>
                                <td className="p-2 border">{med.duration}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Patient Modal */}
      <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Patient Information</DialogTitle>
          </DialogHeader>

          {selectedPatient ? (
            <div className="space-y-2">
              <p><strong>Name:</strong> {selectedPatient.full_name}</p>
              <p><strong>Email:</strong> {selectedPatient.email}</p>
              <p><strong>Phone:</strong> {selectedPatient.phone || "N/A"}</p>
              <p><strong>Date of Birth:</strong> {selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : "N/A"}</p>
              <p><strong>Gender:</strong> {selectedPatient.gender || "N/A"}</p>
              <p><strong>Address:</strong> {selectedPatient.address || "N/A"}</p>
              <p><strong>Emergency Contact:</strong> {selectedPatient.emergency_contact || "N/A"}</p>
              <p><strong>Medical History:</strong> {selectedPatient.medical_history || "N/A"}</p>
            </div>
          ) : (
            <p className="text-center text-gray-500">Loading patient info...</p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isConsultModalOpen} onOpenChange={setIsConsultModalOpen}>
        <DialogContent className="max-w-4xl h-[630px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Start Consultation</DialogTitle>
          </DialogHeader>

          {/* Scrollable content */}
          {consultPatient && (
            <div className="overflow-y-auto flex-1 space-y-4 px-2">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Left column */}
                <div className="space-y-2">
                  <p>
                    <strong>Patient:</strong> {consultPatient.full_name}
                  </p>
                  <p>
                    <strong>Symptoms:</strong>{" "}
                    {waitingPatients.find((p) => p.patient_id === consultPatient.id)?.symptoms || "N/A"}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {waitingPatients.find((p) => p.patient_id === consultPatient.id)?.appointment_time || "N/A"}
                  </p>
                </div>

                {/* Right column */}
                <div className="space-y-2">
                  <p>
                    <strong>Medical History:</strong>{" "}
                    {consultPatient.medical_history && consultPatient.medical_history.trim() !== ""
                      ? consultPatient.medical_history
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Age:</strong>{" "}
                    {consultPatient.date_of_birth
                      ? Math.floor(
                        (new Date().getTime() -
                          new Date(consultPatient.date_of_birth).getTime()) /
                        (365.25 * 24 * 60 * 60 * 1000)
                      )
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Gender:</strong> {consultPatient.gender || "N/A"}
                  </p>
                </div>
              </div>

              <p className="font-medium mb-2">Diagnosis</p>
              <Input
                placeholder="Diagnosis"
                value={prescription.diagnosis}
                onChange={(e) => setPrescription({ ...prescription, diagnosis: e.target.value })}
              />

              <div>
                <p className="font-medium mb-2">Medicines</p>
                {prescription.medicines.map((med, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <select
                      className="border rounded px-2"
                      value={med.name}
                      onChange={(e) => {
                        const meds = [...prescription.medicines];
                        meds[index].name = e.target.value;
                        setPrescription({ ...prescription, medicines: meds });
                      }}
                    >
                      <option value="">Select Medicine</option>
                      {medicineOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>

                    <select
                      className="border rounded px-2"
                      value={med.dosage}
                      onChange={(e) => {
                        const meds = [...prescription.medicines];
                        meds[index].dosage = e.target.value;
                        setPrescription({ ...prescription, medicines: meds });
                      }}
                    >
                      <option value="">Select Dosage</option>
                      {dosageOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <Input
                      placeholder="Duration"
                      type="number"
                      value={med.duration}
                      className="w-50"
                      onChange={(e) => {
                        const meds = [...prescription.medicines];
                        meds[index].duration = e.target.value;
                        setPrescription({ ...prescription, medicines: meds });
                      }}
                    />
                    <span className="text-center mt-1">Days</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={prescription.medicines.length === 1}
                      onClick={() => {
                        const meds = [...prescription.medicines];
                        meds.splice(index, 1); // remove the medicine at current index
                        setPrescription({ ...prescription, medicines: meds });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPrescription({
                    ...prescription,
                    medicines: [...prescription.medicines, { name: "", dosage: "", duration: "" }]
                  })}
                >
                  + Add Medicine
                </Button>
              </div>

              <p className="font-medium mb-2">Suggestions</p>
              <Input
                placeholder="Suggestions"
                value={prescription.suggestions}
                onChange={(e) => setPrescription({ ...prescription, suggestions: e.target.value })}
              />

              <p className="font-medium mb-2">Follow Up Date</p>
              <Input
                type="date"
                value={prescription.followUpDate}
                onChange={(e) => setPrescription({ ...prescription, followUpDate: e.target.value })}
              />

              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => setIsConsultModalOpen(false)} variant="outline">Cancel</Button>
                <Button
                  className="bg-medical-green text-white"
                  onClick={async () => {
                    if (!consultPatient || !profile) return;

                    // Find the appointment ID for this patient in waitingPatients
                    const appointment = waitingPatients.find(p => p.patient_id === consultPatient.id);
                    if (!appointment) {
                      toast.error("Appointment not found",{
                        style: { background: "#dcfce7", color: "#ec2323ff" },
                      });
                      return;
                    }

                    try {
                      const { error } = await supabase
                        .from("medical_records")
                        .insert([{
                          patient_id: consultPatient.id,
                          doctor_id: profile.id,
                          appointment_id: appointment.id,
                          diagnosis: prescription.diagnosis,
                          medicines: prescription.medicines,
                          suggestions: prescription.suggestions,
                          follow_up_date: prescription.followUpDate || null,
                        }]);

                      if (error) {
                        console.error("Error saving prescription:", error);
                        toast.error("Failed to save prescription", {
                          style: { background: "#dcfce7", color: "#ec2323ff" },
                        });
                        return;
                      }

                      const { error: statusError } = await supabase
                        .from("appointments")
                        .update({ status: "consulted" })
                        .eq("id", appointment.id);

                      if (statusError) {
                        toast.error("Prescription saved but failed to update appointment status", {
                          style: { background: "#dcfce7", color: "#ec2323ff" },
                        });
                        return;
                      }

                      // 4. Update local state
                      setAppointments(prev =>
                        prev.map(a =>
                          a.id === appointment.id ? { ...a, status: "consulted" } : a
                        )
                      );

                      // Close the modal after saving
                      toast.success("Prescription saved successfully!", {
                        style: { background: "#dcfce7", color: "#166534" },
                      });
                      setIsConsultModalOpen(false);

                    } catch (err: any) {
                      console.error("Unexpected error:", err);
                      toast.error("Failed to save prescription",{
                        style: { background: "#dcfce7", color: "#ec2323ff" },
                      });
                    }
                  }}
                >
                  Save Prescription
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
