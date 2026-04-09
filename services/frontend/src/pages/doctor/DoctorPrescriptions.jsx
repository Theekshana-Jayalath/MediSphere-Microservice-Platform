import { useEffect, useState } from "react";
import PrescriptionTable from "../../components/doctor/PrescriptionTable";
import {
  deletePrescription,
  getAllPrescriptions,
} from "../../services/doctor/prescriptionApi";
import { downloadPrescriptionPdf } from "../../utils/prescriptionPdf";

const DoctorPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError] = useState("");

  const fetchPrescriptions = async () => {
    try {
      const response = await getAllPrescriptions();
      setPrescriptions(response.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load prescriptions");
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deletePrescription(id);
      fetchPrescriptions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete prescription");
    }
  };

  const handleDownload = (prescription) => {
    try {
      setError("");
      downloadPrescriptionPdf(prescription);
    } catch (err) {
      setError(err.message || "Failed to generate prescription PDF");
    }
  };

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700">{error}</div>
      )}
      <PrescriptionTable
        prescriptions={prescriptions}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default DoctorPrescriptions;