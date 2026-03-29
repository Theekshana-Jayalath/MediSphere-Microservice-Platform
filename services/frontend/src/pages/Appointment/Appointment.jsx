import React, {useState} from "react";
import FilterSidebar from "../../components/Appointment/FilterSidebar.jsx";
import TopSearch from "../../components/Appointment/TopSearch.jsx";
import DoctorCard from "../../components/Appointment/DoctorCard.jsx";
import { doctors } from "../../data/doctors";

const Appointment = () => {

const [search,setSearch] = useState("");

const filtered = doctors.filter(d =>
d.name.toLowerCase().includes(search.toLowerCase())
);

return (

<div className="min-h-screen p-6" style={{ backgroundColor: 'var(--ms-accent)' }}>

<TopSearch search={search} setSearch={setSearch}/>

<div className="grid grid-cols-1 md:grid-cols-5 gap-6">

	<div className="md:col-span-1">
		<FilterSidebar />
	</div>

	<div className="md:col-span-4 grid items-stretch grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{filtered.map((doc) => (
			<DoctorCard key={doc.id} doctor={doc} />
		))}
	</div>

</div>

</div>
);
};

export default Appointment;