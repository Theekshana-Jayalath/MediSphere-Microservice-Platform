export const getAppointments = (req, res) => {

  const appointments = [
    {
      id: 1,
      patient: "John",
      doctor: "Dr. Silva",
      date: "2026-03-20"
    },
    {
      id: 2,
      patient: "Anna",
      doctor: "Dr. Perera",
      date: "2026-03-22"
    }
  ];

  res.json(appointments);

};