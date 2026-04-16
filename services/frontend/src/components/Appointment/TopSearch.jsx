import React from "react";

const TopSearch = ({search,setSearch}) => {
return (
	<div className="shadow-sm p-4 rounded-xl mb-4 flex items-center justify-between " style={{ backgroundColor: 'var(--ms-primary)' }}>
		<h2 className="text-2xl font-semibold text-gray-800 pr-200 ml-10"> Expert Specialists </h2>
        <input
			type="text"
			placeholder="Search by name..."
			value={search}
			onChange={(e)=>setSearch(e.target.value)}
			className="border rounded-lg px-4 py-2 w-72 focus:outline-none"
			style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)' }}
		/>

	</div>
);
};

export default TopSearch;