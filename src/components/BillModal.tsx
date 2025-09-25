import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import { supabase } from "@/supabase/supabaseClient";
import { toast } from "sonner";

interface Medicine {
  name: string;
  rate: number;
  quantity: number;
  total?: number;
}

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billId: string;
  date: string;
  time: string; // add time if you want to display it
  patientName: string;
  doctorName: string;
  patientId: string;
  doctorId: string;
  medicines: {
    name: string;
    dosage: string;
    duration: string;
    rate: number;
    quantity: number;
    total: number;
  }[];
}


const BillModal: React.FC<BillModalProps> = ({ isOpen, onClose, billId, date, patientName, doctorName, medicines, patientId, doctorId, }) => {
  const grandTotal = medicines.reduce((total, item) => total + item.rate * item.quantity, 0);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [editedMedicines, setEditedMedicines] = useState<Medicine[]>([...medicines]);
  const [currentTime, setCurrentTime] = useState("");
  const [paymentMode, setPaymentMode] = useState("");

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setCurrentTime(timeString);
    }
  }, [isOpen]);

  const handleDownloadPDF = async () => {
    if (!paymentMode) {
      toast.error("Please select a payment method!", {
        style: { background: "#fee2e2", color: "#b91c1c" },
      });
      return; // stop execution if not selected
    }

    const doc = new jsPDF();
    let y = 20;

    // Calculate medicine cost and total amount
    const medicineCost = medicines.reduce((sum, med) => sum + med.rate * med.quantity, 0);
    const totalAmount = medicineCost; // consultation fee removed

    // Save bill to Supabase
    const { data, error } = await supabase
      .from('bills')
      .insert([
        {
          patient_id: patientId,
          doctor_id: doctorId,
          medicine_cost: medicineCost,
          total_amount: totalAmount,
          status: 'Paid',
          payment_mode: paymentMode
        }
      ]);

    if (error) {
      toast.error("Error in Saving Bill !", {
        style: { background: "#fee2e2", color: "#b91c1c" },
      });
    } else {
      toast.success("Bill Saved Sucessfully !", {
        style: { background: "#dcfce7", color: "#166534" },
      });
    }

    // PDF Header
    doc.setFontSize(18);
    doc.text("MediCloud Bill", 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Bill No: ${billId}`, 14, y);
    doc.text(`Date: ${date}`, 150, y, { align: "right" });
    y += 7;
    doc.text(`Patient Name: ${patientName}`, 14, y);
    doc.text(`Time: ${currentTime}`, 150, y, { align: "right" });
    y += 7;
    doc.text(`Doctor Name: ${doctorName}`, 14, y);
    y += 10;

    // Table Header
    doc.setFont(undefined, "bold");
    doc.text("S.No", 14, y);
    doc.text("Medicine", 30, y);
    doc.text("Rate", 100, y);
    doc.text("Qty", 120, y);
    doc.text("Total", 140, y);
    doc.setFont(undefined, "normal");
    y += 7;

    // Table Rows
    medicines.forEach((med, index) => {
      doc.text(`${index + 1}`, 14, y);
      doc.text(med.name, 30, y);
      doc.text(`₹${med.rate}`, 100, y);
      doc.text(`${med.quantity}`, 120, y);
      const itemTotal = med.total ?? med.rate * med.quantity;
      doc.text(`₹${itemTotal}`, 140, y);
      y += 7;
    });

    y += 10;
    doc.setFont(undefined, "bold");
    y += 3;
    doc.text(`Grand Total: ₹${totalAmount}`, 14, y);

    // Save PDF
    doc.save(`MediCloud-Bill-${billId}.pdf`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-6 h-[550px]" aria-describedby="bill-description">
        <DialogHeader>
          <DialogTitle className="flex justify-center items-center space-x-2 text-2xl font-bold text-indigo-700">
            <div className="bg-blue-600 text-white rounded-lg px-2 py-1 font-bold text-xl">M</div>
            <span className="text-2xl font-bold text-black">MediCloud</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-between text-sm">
          <div>
            <p><strong>Bill No:</strong> {billId}</p>
            <p><strong>Patient Name:</strong> {patientName}</p>
            <p><strong>Doctor Name:</strong> Dr. {doctorName}</p>
          </div>
          <div className="text-right">
            <p><strong>Date:</strong> {date}</p>
            <p><strong>Time:</strong> {currentTime}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-300 text-center">
            <thead className="bg-gray-100">
              <tr>
                {isEditing && <th className="p-2 border">✔</th>}
                <th className="p-2 border">Sr. No.</th>
                <th className="p-2 border">Medicine Name</th>
                <th className="p-2 border">Rate (₹)</th>
                <th className="p-2 border">Quantity</th>
                <th className="p-2 border">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {editedMedicines.map((med, index) => {
                const isSelected = selectedRows.includes(index);

                return (
                  <tr key={index} className="border">
                    {isEditing && (
                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedRows(selectedRows.filter(i => i !== index));
                            } else {
                              setSelectedRows([...selectedRows, index]);
                            }
                          }}
                        />
                      </td>
                    )}
                    <td className="p-2 border">{index + 1}</td>
                    <td className="p-2 border">{med.name}</td>
                    <td className="p-2 border">₹{med.rate}</td>
                    <td className="p-2 border">
                      {isEditing && isSelected ? (
                        <input
                          type="number"
                          min="0"
                          value={med.quantity}
                          className="border p-1 w-16"
                          onChange={(e) => {
                            const updated = [...editedMedicines];
                            updated[index].quantity = parseInt(e.target.value) || 0;
                            setEditedMedicines(updated);
                          }}
                        />
                      ) : (
                        med.quantity
                      )}
                    </td>
                    <td className="p-2 border">₹{(med.rate * med.quantity).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mb-4">
          {/* Payment Method Dropdown */}
          <div>
            <label className="mr-2 font-medium">Payment Mode:</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="border rounded p-1 w-28"
            >
              <option value="">-- Select --</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          {/* Final Amount */}
          <div className="mt-1 text-right text-lg font-semibold">
            Final Amount to Pay: ₹{grandTotal}
          </div>
        </div>

        <div className="mt-auto flex justify-end space-x-4">
          <Button onClick={() => setIsEditing(!isEditing)} className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800">
            {isEditing ? "Save Changes" : "Update Items"}
          </Button>
          <Button onClick={handleDownloadPDF} className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800">Save Bill and Download PDF</Button>
          <Button onClick={onClose} className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillModal;
