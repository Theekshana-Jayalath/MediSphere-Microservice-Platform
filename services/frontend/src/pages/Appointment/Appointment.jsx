import React, {useState} from "react";
import FilterSidebar from "../../components/Appointment/FilterSidebar.jsx";
import TopSearch from "../../components/Appointment/TopSearch.jsx";
import ProgressBar from "../../components/Appointment/ProgressBar.jsx";
import DoctorCard from "../../components/Appointment/DoctorCard.jsx";
import { doctors } from "../../data/doctors";


const Appointment = () => {

const [search,setSearch] = useState("");
// sample appointment status - in real app this would come from data
const [appointmentStatus] = useState('booked');

const filtered = doctors.filter(d =>
d.name.toLowerCase().includes(search.toLowerCase())
);

return (

<div className="min-h-screen p-6" style={{ backgroundColor: 'var(--ms-accent)' }}>

<div className="top-area mb-4">
		<div className="left-top flex-1">
			<ProgressBar appointmentStatus={appointmentStatus} />
	</div>
	<TopSearch search={search} setSearch={setSearch}/>
</div>

<div className="grid grid-cols-1 md:grid-cols-5 gap-10">

	<div className="md:col-span-1">
		<FilterSidebar />
	</div>

	{filtered.length === 0 ? (
		<div className="md:col-span-4 flex items-center justify-center">
			<div className="ms-card p-6 rounded-xl w-full max-w-2xl" style={{ color: 'var(--ms-mid)' }}>
				
				<div className="text-center text-lg">
					No matching doctors found
				</div>
			</div>
		</div>
	) : (
		<div className="md:col-span-4 grid items-stretch grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{filtered.map((doc) => (
				<DoctorCard key={doc.id} doctor={doc} />
			))}
		</div>
	)}

</div>

</div>
);
};

export default Appointment;