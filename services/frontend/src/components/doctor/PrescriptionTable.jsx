const PrescriptionTable = ({ prescriptions, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4 text-teal-900">
        Prescription List
      </h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-teal-100 text-left">
            <th className="p-3 border">Doctor</th>
            <th className="p-3 border">Patient</th>
            <th className="p-3 border">Appointment</th>
            <th className="p-3 border">Diagnosis</th>
            <th className="p-3 border">Status</th>
            <th className="p-3 border">Issued Date</th>
            <th className="p-3 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {prescriptions.length > 0 ? (
            prescriptions.map((prescription) => (
              <tr key={prescription._id} className="hover:bg-gray-50">
                <td className="p-3 border">{prescription.doctorName}</td>
                <td className="p-3 border">{prescription.patientName}</td>
                <td className="p-3 border">{prescription.appointmentId}</td>
                <td className="p-3 border">{prescription.diagnosis}</td>
                <td className="p-3 border">{prescription.status}</td>
                <td className="p-3 border">
                  {new Date(prescription.issuedDate).toLocaleDateString()}
                </td>
                <td className="p-3 border">
                  <button
                    onClick={() => onDelete(prescription._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="p-4 text-center text-gray-500">
                No prescriptions found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PrescriptionTable;