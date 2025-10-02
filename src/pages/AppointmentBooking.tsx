import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, IndianRupee } from "lucide-react";
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  consultation_fee: number;
  available_from: string;
  available_to: string;
}
/**
 * Converts 12-hour time (e.g., "02:30 PM") to 24-hour format ("14:30")
 * Returns empty string if input is invalid
 */
const convertTo24Hour = (time?: string): string => {
  if (!time || typeof time !== "string") {
    console.warn("convertTo24Hour received invalid time:", time);
    return "";
  }

  // Match format like "hh:mm AM/PM"
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    console.warn("convertTo24Hour: time format invalid:", time);
    return "";
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridian = match[3].toUpperCase();

  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  // Pad hours with leading zero if needed
  const hoursStr = hours.toString().padStart(2, "0");

  return `${hoursStr}:${minutes}`;
};

interface AppointmentBookingProps {
  onBookingSuccess?: () => void;
}

const AppointmentBooking = ({ onBookingSuccess }: AppointmentBookingProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [appointmentData, setAppointmentData] = useState({
    doctorId: "",
    appointmentDate: "",
    appointmentTime: "",
    symptoms: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, full_name, specialization, consultation_fee, available_from, available_to');

      if (error) {
        console.error("Error fetching doctors:", error);
        toast({
          title: "Error",
          description: "Failed to fetch doctors. Please try again.",
          variant: "destructive",
        });
      } else {
        setDoctors(data || []);
      }
    };

    fetchDoctors();
  }, [toast]);

  const handleDoctorSelect = async (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    setSelectedDoctor(doctor || null);
    setAppointmentData(prev => ({ ...prev, doctorId: doctorId, appointmentDate: "" }));

    if (doctor?.available_from && doctor?.available_to) {
      const today = new Date();
      const toHour = parseInt(doctor.available_to.split(":")[0]);
      const isTodayExpired = today.getHours() >= toHour - 1;

      const defaultDate = isTodayExpired
        ? new Date(today.setDate(today.getDate() + 1)).toISOString().split("T")[0]
        : today.toISOString().split("T")[0];

      setAppointmentData((prev) => ({ ...prev, appointmentDate: defaultDate }));

      const bookedSlots = await fetchBookedSlots(doctorId, defaultDate);
      const times = generateAvailableTimes(doctor.available_from, doctor.available_to, defaultDate, bookedSlots);
      setAvailableTimes(times);
    } else {
      setAvailableTimes([]);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setAppointmentData(prev => ({ ...prev, [id]: value }));

    if (
      id === "appointmentDate" &&
      selectedDoctor?.available_from &&
      selectedDoctor?.available_to
    ) {
      const bookedSlots = await fetchBookedSlots(selectedDoctor.id, value);
      const times = generateAvailableTimes(
        selectedDoctor.available_from,
        selectedDoctor.available_to,
        value,
        bookedSlots
      );
      setAvailableTimes(times);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !user) {
      toast({
        title: "Error",
        description: "Please select a doctor and ensure you are logged in.",
        variant: "destructive",
      });
      return;
    }
    if (!appointmentData.symptoms.trim()) {
      toast({
        title: "Error",
        description: "Please enter your symptoms before booking.",
        variant: "destructive",
      });
      return;
    }

    // 🔴 Check for required appointment time
    if (!appointmentData.appointmentTime) {
      toast({
        title: "Error",
        description: "Please select an appointment time before booking.",
        variant: "destructive",
      });
      return;
    }
    if (!appointmentData.symptoms.trim()) {
      toast({
        title: "Error",
        description: "Please enter your symptoms before booking.",
        variant: "destructive",
      });
      return;
    }
    const appointmentTime = convertTo24Hour(appointmentData.appointmentTime);

    setIsLoading(true);

    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        patient_id: user.id,
        doctor_id: selectedDoctor.id,
        appointment_date: appointmentData.appointmentDate,
        appointment_time: appointmentTime,
        symptoms: appointmentData.symptoms
      }]);

    if (error) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Appointment booked successfully!",
      });
      if (onBookingSuccess) onBookingSuccess();
      setAppointmentData({
        doctorId: "",
        appointmentDate: "",
        appointmentTime: "",
        symptoms: ""
      });
      setSelectedDoctor(null);
    }

    setIsLoading(false);
  };
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // "YYYY-MM-DD"
  };
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };
  const generateAvailableTimes = (
    from: string | undefined,
    to: string | undefined,
    selectedDate: string,
    bookedSlots: string[] = []
  ) => {
    if (!from || !to) return [];

    const times: string[] = [];
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    const [fromHour, fromMin] = from.split(":").map(Number);
    const [toHour, toMin] = to.split(":").map(Number);

    // Convert available_from and available_to to Date objects
    const baseDate = new Date();
    const fromTime = new Date(baseDate.setHours(fromHour, fromMin, 0, 0));
    const toTime = new Date(baseDate.setHours(toHour, toMin, 0, 0));

    for (let slotTime = new Date(fromTime); slotTime < toTime; slotTime.setMinutes(slotTime.getMinutes() + 30)) {
      // Skip booked slots
      const time24 = slotTime.toTimeString().split(" ")[0]; // HH:MM:SS
      if (bookedSlots.includes(time24)) continue;

      // Skip if it's today and less than 1 hour from now
      if (selectedDate === today) {
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        if (slotTime < oneHourLater) continue;
      }

      // Format for display (12-hour)
      const hour = slotTime.getHours();
      const minute = slotTime.getMinutes();
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const displayMinute = minute.toString().padStart(2, "0");
      times.push(`${displayHour}:${displayMinute} ${period}`);
    }

    return times;
  };
  const fetchBookedSlots = async (doctorId: string, date: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date);

    if (error) {
      console.error("Error fetching booked slots:", error);
      return [];
    }

    return (data || []).map((item) => item.appointment_time);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Book New Appointment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Doctor</Label>
          <Select onValueChange={handleDoctorSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  <div className="flex justify-between items-center w-full">
                    <span>Dr. {doctor.full_name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {doctor.specialization}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDoctor && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium">Dr. {selectedDoctor.full_name}</h4>
            <p className="text-sm text-gray-600">{selectedDoctor.specialization}</p>
            <p className="text-sm flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              Consultation Fee: ₹{selectedDoctor.consultation_fee}
            </p>
            <p className="text-sm text-gray-600">
              Available: {selectedDoctor.available_from} - {selectedDoctor.available_to}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="appointmentDate">Appointment Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="date"
              id="appointmentDate"
              className="pl-10"
              value={appointmentData.appointmentDate}
              onChange={handleInputChange}
              min={
                selectedDoctor && new Date().getHours() >= parseInt(selectedDoctor.available_to.split(":")[0]) - 1
                  ? getTomorrowDate()
                  : getTodayDate()
              }
            />
          </div>
          {selectedDoctor && appointmentData.appointmentDate !== getTodayDate() && (
            <p className="text-sm text-red-500 font-bold text-muted-foreground -mt-2">
              Today's slots are unavailable. Booking starts from tomorrow.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="appointmentTime">Appointment Time</Label>
          <Select onValueChange={(value) => setAppointmentData(prev => ({ ...prev, appointmentTime: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a time" />
            </SelectTrigger>
            <SelectContent>
              {availableTimes.map((time, index) => (
                <SelectItem key={index} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="symptoms">Symptoms</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Textarea
              id="symptoms"
              placeholder="Describe your symptoms"
              className="pl-10"
              value={appointmentData.symptoms}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <Button
          onClick={handleBookAppointment}
          disabled={isLoading || !selectedDoctor}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
        >
          {isLoading ? "Booking..." : `Book Appointment - ₹${selectedDoctor?.consultation_fee || 0}`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AppointmentBooking;
