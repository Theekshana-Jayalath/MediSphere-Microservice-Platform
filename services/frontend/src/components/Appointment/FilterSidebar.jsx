import React from "react";

const FilterSidebar = () => {
return (
<div className="bg-white p-6 rounded-xl shadow-sm">
<h3 className="text-lg font-semibold mb-4">Filters</h3>

<div className="mb-6">
<p className="text-sm text-gray-500 mb-2">SPECIALTY</p>

<div className="space-y-2">
<label className="flex gap-2">
<input type="checkbox"/> Cardiology
</label>

<label className="flex gap-2">
<input type="checkbox"/> Neurology
</label>

<label className="flex gap-2">
<input type="checkbox"/> Pediatrics
</label>

<label className="flex gap-2">
<input type="checkbox"/> Dermatology
</label>
</div>
</div>

<div className="mb-6">
<p className="text-sm text-gray-500 mb-2">HOSPITAL</p>

<select className="w-full border rounded-lg p-2">
<option>All Hospitals</option>
<option>Central Health Hub</option>
<option>Skyline Medical Center</option>
</select>
</div>

<div>
<p className="text-sm text-gray-500 mb-2">DATE</p>
<input type="date" className="w-full border p-2 rounded-lg"/>
</div>

</div>
);
};

export default FilterSidebar;