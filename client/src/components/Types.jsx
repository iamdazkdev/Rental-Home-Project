import React from "react";
import { types } from "../data";
import "../styles/Types.scss";

const Types = ({ selectedType, onTypeSelect }) => {
  return (
    <div className="types-filter">
      <div className="types-container">
        <h2>Property Types</h2>
        <div className="types-list">
          <button
            className={`type-card ${!selectedType ? "active" : ""}`}
            onClick={() => onTypeSelect(null)}
          >
            <div className="type-icon">🏠</div>
            <div className="type-content">
              <h3>All Types</h3>
              <p>Show all properties</p>
            </div>
          </button>

          {types.map((type, index) => (
            <button
              key={index}
              className={`type-card ${selectedType === type.name ? "active" : ""}`}
              onClick={() => onTypeSelect(type.name)}
            >
              <div className="type-icon">{type.icon}</div>
              <div className="type-content">
                <h3>{type.name}</h3>
                <p>{type.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Types;

