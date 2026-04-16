import React from "react";

const specialtyOptions = ["Cardiology", "Neurology", "Pediatrics", "Dermatology"];

const FilterSidebar = ({ selectedSpecialties = [], setSelectedSpecialties, selectedHospital = 'All Hospitals', setSelectedHospital, selectedDate = '', setSelectedDate, onClear, dateError = false, setDateError }) => {

	const toggleSpecialty = (spec) => {
		if (selectedSpecialties.includes(spec)) {
			setSelectedSpecialties(selectedSpecialties.filter(s => s !== spec));
		} else {
			setSelectedSpecialties([...selectedSpecialties, spec]);
		}
	}

	const today = new Date().toISOString().split('T')[0];

	return (
		<div className="bg-white p-6 rounded-xl shadow-sm">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold">Filters</h3>
				{onClear && (
					<button onClick={() => { setDateError && setDateError(false); onClear(); }} className="text-sm text-blue-600">Clear</button>
				)}
			</div>

			<div className="mb-6">
				<p className="text-sm text-gray-500 mb-2">SPECIALTY</p>

				<div className="space-y-2">
					{specialtyOptions.map(s => (
						<label key={s} className="flex gap-2 items-center">
							<input type="checkbox" checked={selectedSpecialties.includes(s)} onChange={() => toggleSpecialty(s)} />
							<span>{s}</span>
						</label>
					))}
				</div>
			</div>

			<div className="mb-6">
				<p className="text-sm text-gray-500 mb-2">HOSPITAL</p>

				<select value={selectedHospital} onChange={(e) => setSelectedHospital(e.target.value)} className="w-full border rounded-lg p-2">
					<option>All Hospitals</option>
					<option>Central Health Hub</option>
					<option>Skyline Medical Center</option>
					<option>Oakwood Children's Clinic</option>
					<option>Eastside Medical Hub</option>
				</select>
			</div>

			<div>
				<p className="text-sm text-gray-500 mb-2">Appointment Date</p>
				<input
					type="date"
					value={selectedDate}
					onChange={(e) => { setSelectedDate(e.target.value); if (dateError && setDateError) setDateError(false); }}
					min={today}
					className="w-full border p-2 rounded-lg"
				/>
				{dateError ? (
					<div className="mt-2 text-xs text-red-600">Appointment date is required.</div>
				) : (
					selectedDate && (
						<div className="mt-2 text-xs text-gray-600">Selected: {selectedDate}</div>
					)
				)}
			</div>

		</div>
	);
};

export default FilterSidebar;