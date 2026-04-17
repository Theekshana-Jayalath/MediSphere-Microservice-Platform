import { useSearchParams } from "react-router-dom";
import PrescriptionForm from "../../components/doctor/PrescriptionForm";

const DoctorCreatePrescription = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";

  return (
    <div className="create-prescription-page">
      <PrescriptionForm sessionId={sessionId} />
    </div>
  );
};

export default DoctorCreatePrescription;