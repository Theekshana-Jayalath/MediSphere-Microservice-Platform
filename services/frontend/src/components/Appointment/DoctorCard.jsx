import React from "react";

const DoctorCard = ({doctor}) => {
return (
<div className="rounded-2xl shadow-sm p-5 flex gap-5 hover:shadow-md transition h-50 w-full" style={{ backgroundColor: 'var(--ms-primary)' }}>

<img
src={doctor.image}
className="w-20 h-20 rounded-xl object-cover"
/>

<div className="flex-1 flex flex-col justify-between">

<div className="flex justify-between">
<span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--ms-light)', color: 'var(--ms-dark)' }}>
{doctor.specialty}
</span>

<span className="font-semibold" style={{ color: 'var(--ms-mid)' }}>
⭐ {doctor.rating}
</span>
</div>

<h3 className="text-lg font-semibold mt-2" style={{ color: 'var(--ms-dark)' }}>
{doctor.name}
</h3>

<p className="text-sm" style={{ color: 'var(--ms-mid)' }}>
{doctor.hospital}
</p>

<div className="flex justify-between items-center mt-3">
<span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: 'var(--ms-dark)' }}>
{doctor.experience}
</span>

<button className="ms-btn-primary px-4 py-1 rounded-lg">
	Book Now
</button>

</div>

</div>
</div>
);
};

export default DoctorCard;