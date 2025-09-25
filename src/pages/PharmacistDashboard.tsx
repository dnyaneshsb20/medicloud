// src/pages/PharmacistDashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/supabase/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Search, User, Phone, LogOut, Eye, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast, useToast } from "@/hooks/use-toast";
import BillModal from '@/components/BillModal';
import { format } from "date-fns";
import { useAuth } from "@/components/auth/AuthProvider";

const insertBill = async ({
  patient_id,
  doctor_id,
  consultation_fee,
  medicine_cost,
}: {
  patient_id: string;
  doctor_id: string;
  consultation_fee: number;
  medicine_cost: number;
}) => {
  const total_amount = consultation_fee + medicine_cost;

  const { error } = await supabase.from("bills").insert([
    {
      patient_id,
      doctor_id,
      consultation_fee,
      medicine_cost,
      total_amount,
      status: "unpaid",
    },
  ]);

  if (error) {
    console.error("Error inserting bill:", error.message);
    toast({
      title: "Error",
      description: "Failed to generate bill",
      variant: "destructive",
    });
  } else {
    toast({
      title: "Success",
      description: "Bill generated successfully",
    });
  }
};

interface Medicine {
  name: string;
  dosage: string;
  duration: string;
}
interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  patient: {
    full_name: string;
    phone: string;
  };
  doctor: {
    doctor_id: string;
    full_name: string;
  };
  created_at: string;
  diagnosis: string;
  medicines: Medicine[];
  suggestions: string;
  follow_up_date?: string;
}

const PharmacistDashboard = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pharmacistName, setPharmacistName] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [medicineName, setMedicineName] = useState("");
  const [medicineType, setMedicineType] = useState("");
  const [medicinePrice, setMedicinePrice] = useState("");
  const [price, setPrice] = useState('');
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState('');
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [billDetails, setBillDetails] = useState<any>(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPharmacistData = async () => {
      setLoading(true);

      // 1) Verify logged-in user is a pharmacist
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from("pharmacists")
        .select("*")
        .eq("id", user?.id)
        .maybeSingle();

      if (!pharmacistData) {
        toast({
          title: "Error",
          description: "You are not a pharmacist",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      setPharmacistName(pharmacistData.full_name);

      // 2) Fetch today's medical_records and bring related patient + doctor rows
      const { data: records, error } = await supabase
        .from("medical_records")
        .select(`
        id,
        patient_id,
        doctor_id,
        appointment_id,
        diagnosis,
        medicines,
        suggestions,
        follow_up_date,
        created_at,
        patients ( full_name, phone ),
        doctors  ( id, full_name )
      `)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching medical records:", error);
        toast({
          title: "Error",
          description: "Could not fetch today's medical records",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 3) Map response into the Prescription shape; handle both array/object relation shapes
      const formatted = (records || []).map((record: any) => {
        // Supabase/PostgREST sometimes returns related rows as an object or array.
        const patientObj = Array.isArray(record.patients) ? record.patients[0] : record.patients;
        const doctorObj = Array.isArray(record.doctors) ? record.doctors[0] : record.doctors;

        return {
          id: record.id,
          patient_id: record.patient_id,
          doctor_id: record.doctor_id,
          created_at: record.created_at,
          diagnosis: record.diagnosis,
          suggestions: record.suggestions,
          medicines: record.medicines || [],
          follow_up_date: record.follow_up_date,
          patient: {
            full_name: patientObj?.full_name || "Unknown",
            phone: patientObj?.phone || "N/A",
          },
          doctor: {
            doctor_id: doctorObj?.id || record.doctor_id,
            full_name: doctorObj?.full_name || "Unknown Doctor",
          },
        } as Prescription;
      });

      setPrescriptions(formatted);
      setLoading(false);
    };

    // only run if user is available
    if (user) fetchPharmacistData();
  }, [user, today]);


  const filtered = prescriptions.filter(
    (p) =>
      p.patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      window.location.href = "/";
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
  const handleAddMedicine = async () => {
    // Trim inputs and convert type to lowercase
    const trimmedName = name.trim();
    const trimmedType = type.trim().toLowerCase();
    const parsedPrice = parseFloat(price);

    console.log("Insert Payload:", {
      name: trimmedName,
      type: trimmedType,
      price: parsedPrice,
    });

    // ✅ Basic validation
    if (
      !trimmedName ||
      !trimmedType ||
      !price ||
      isNaN(parsedPrice) ||
      parsedPrice <= 0
    ) {
      toast({
        title: "Error",
        description: "Please fill all fields correctly.",
        variant: "destructive",
      });
      return;
    }

    // ✅ Check type matches allowed values
    const allowedTypes = ["syrup", "tablet", "capsule", "injection", "other"];
    if (!allowedTypes.includes(trimmedType)) {
      toast({
        title: "Error",
        description: "Medicine type must be: syrup, tablet, capsule, injection, or other.",
        variant: "destructive",
      });
      return;
    }

    // ✅ Insert into Supabase
    const { data, error } = await supabase.from("medicine_names").insert([
      {
        name: trimmedName,
        type: trimmedType,
        price: parsedPrice,
      },
    ]);

    console.log("Supabase Response:", { data, error });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add medicine: " + error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Medicine Added Successfully!",
        style: { background: "#dcfce7", color: "#166534" }
      });
      // Clear form and close modal
      setName("");
      setType("");
      setPrice("");
      setShowAddMedicineModal(false);
    }
  };
  // Utility: convert dosage like "1-0-1" to number of doses per day
  const getDosesPerDay = (pattern: string): number => {
    return pattern
      .split('-')
      .map((n) => parseInt(n))
      .filter((n) => !isNaN(n))
      .reduce((a, b) => a + b, 0);
  };

  // Utility: extract duration in days from string like "5 Days"
  const getDurationInDays = (duration: string): number => {
    const match = duration.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  // Final utility: calculate quantity
  const calculateQuantity = (dosage: string, duration: string) => {
    const timesPerDay = dosage
      .split("-")
      .reduce((sum, val) => sum + parseInt(val || "0"), 0);

    const daysMatch = duration.match(/\d+/); // Extract the number from "4 Days"
    const numberOfDays = daysMatch ? parseInt(daysMatch[0]) : 0;

    return timesPerDay * numberOfDays;
  };


  const handleGenerateBill = async () => {
    if (!selectedPrescription) return;

    // 2. Fetch medicine rates
    const medicineNames = selectedPrescription.medicines.map((med: any) => med.name);

    const { data: medicineData, error: medError } = await supabase
      .from("medicine_names")
      .select("name, price")
      .in("name", medicineNames);

    if (medError || !medicineData) {
      toast({
        title: "Error",
        description: "Could not fetch medicine prices.",
        variant: "destructive",
      });
      return;
    }

    // 3. Calculate medicine-wise details
    const medicinesWithQty = selectedPrescription?.medicines?.map((med: any) => {
      const rate = medicineData.find((m) => m.name === med.name)?.price || 0;
      const quantity = calculateQuantity(med.dosage, med.duration);
      return {
        ...med,
        rate,
        quantity,
        total: quantity * rate,
      };
    }) || [];

    // 4. Calculate grand total
    const medicinesTotal = medicinesWithQty.reduce((sum, m) => sum + m.total, 0);
    const grandTotal = medicinesTotal;
    console.log("Medicines With Qty", medicinesWithQty);
    console.log("Medicines with Qty:", medicinesWithQty);
    console.log("Grand Total:", grandTotal);


    // 5. Set bill details
    setBillDetails({
      billId: selectedPrescription.id,
      date: format(new Date(selectedPrescription.created_at), "dd-MM-yyyy"),
      time: format(new Date(selectedPrescription.created_at), "HH:mm"),
      patientName: selectedPrescription.patient.full_name,
      doctorName: selectedPrescription.doctor.full_name,
      patientId: selectedPrescription.patient_id,   // ✅ add this
      doctorId: selectedPrescription.doctor_id,
      medicines: medicinesWithQty,
      grandTotal,
    });

    // 6. Show the modal
    setIsBillOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="text-white rounded-lg px-2 py-1 font-bold text-2xl bg-gradient-to-r from-purple-600 to-indigo-700">
                M
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MediCloud</h1>
                <p className="text-sm text-gray-600">Pharmacist Portal</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Add Medicine
                  </Button>
                </DialogTrigger>

                {/* We'll add DialogContent here in Step 2 */}
                <DialogContent className="w-full max-w-xl h-[520px] rounded-2xl p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Add New Medicine</DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                      Enter the details of the medicine below.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5 mt-4">
                    {/* Medicine Name */}
                    <div>
                      <label className="block text-md font-medium mb-1">Medicine Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter medicine name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-md font-medium mb-1">Type</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                      >
                        <option value="">Select type</option>
                        <option value="syrup">Syrup</option>
                        <option value="tablet">Tablet</option>
                        <option value="capsule">Capsule</option>
                        <option value="injection">Injection</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-md font-medium mb-1">Price (₹)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 text-right">
                      <button
                        onClick={handleAddMedicine}
                        className="px-6 py-3 bg-violet-600 text-white rounded-md text-base hover:bg-violet-700"
                      >
                        Add Medicine
                      </button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">
            {pharmacistName
              ? `${getTimeGreeting()}! ${pharmacistName}`
              : "Welcome, Pharmacist"}
          </h2>
          <p className="text-gray-600">View and track patient prescriptions</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient or doctor name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Recent Prescriptions</span>
            </CardTitle>
            <CardDescription>
              All medical prescriptions created by doctors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filtered.length === 0 ? (
              <p className="text-gray-500">No records found.</p>
            ) : (
              filtered.map((record) => (
                <div
                  key={record.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-3 text-lg">
                      <h4 className="font-semibold text-gray-900 text-xl">
                        {record.patient.full_name}
                      </h4>
                      <div className="text-gray-800 space-y-2 leading-relaxed">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Doctor: Dr. {record.doctor.full_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{record.patient.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(record.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800"
                      onClick={() => {
                        setSelectedPrescription(record);
                        setShowDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Prescription
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal for viewing prescription */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-indigo-700 text-xl font-semibold">
              Prescription Details
            </DialogTitle>
          </DialogHeader>

          {selectedPrescription && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <Card className="p-4">
                <p>
                  <strong>Diagnosis:</strong>{" "}
                  {selectedPrescription.diagnosis || "N/A"}
                </p>
                <p>
                  <strong>Suggestions:</strong>{" "}
                  {selectedPrescription.suggestions || "N/A"}
                </p>
                <p>
                  <strong>Follow-up Date:</strong>{" "}
                  {selectedPrescription.follow_up_date
                    ? new Date(selectedPrescription.follow_up_date).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(selectedPrescription.created_at).toLocaleDateString()}
                </p>

                {selectedPrescription.medicines && (
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
                        {Array.isArray(selectedPrescription.medicines) &&
                          selectedPrescription.medicines.map((med: any, idx: number) => (
                            <tr key={idx}>
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
            </div>
          )}
          <Button
            onClick={handleGenerateBill}
            className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800"
          >
            Generate Bill
          </Button>
        </DialogContent>
      </Dialog>
      {billDetails && (
        <BillModal
          isOpen={isBillOpen}
          onClose={() => setIsBillOpen(false)}
          billId={billDetails.billId}
          date={billDetails.date}
          time={billDetails.time}
          patientName={billDetails.patientName}
          doctorName={billDetails.doctorName}
          patientId={billDetails.patientId}
          doctorId={billDetails.doctorId}
          medicines={billDetails.medicines}
        />
      )}


    </div>
  );
};

export default PharmacistDashboard;