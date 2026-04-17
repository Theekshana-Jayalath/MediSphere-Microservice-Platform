import React from "react";

const TopSearch = ({ search, setSearch }) => {
  const handleFindDoctor = () => {
    // Search functionality - you can add additional logic here
    console.log("Searching for:", search);
  };

  return (
    <div className="top-search">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button onClick={handleFindDoctor} className="find-doctor-btn">
          Find Doctor
        </button>
      </div>
    </div>
  );
};

export default TopSearch;