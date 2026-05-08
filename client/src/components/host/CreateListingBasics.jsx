import React from "react";
import { useFormContext } from "react-hook-form";

const CreateListingBasics = ({ type }) => {
  const { watch, setValue } = useFormContext();
  
  const guestCount = watch("guestCount") || 1;
  const bedroomCount = watch("bedroomCount") || 1;
  const bedCount = watch("bedCount") || 1;
  const bathroomCount = watch("bathroomCount") || 1;
  const roomArea = watch("roomArea") || 0;

  const updateCount = (field, currentVal, type) => {
    if (type === "decrease" && currentVal > 1) {
      setValue(field, currentVal - 1, { shouldValidate: true });
    } else if (type === "increase") {
      setValue(field, currentVal + 1, { shouldValidate: true });
    }
  };

  return (
    <div className="step-section">
      <div className="step-header">
        <div className="step-number">3</div>
        <h2>🏠 Share some basics about your place</h2>
      </div>

      <div className="basics-list">
        {/* Only show Guest Count if NOT Room Rental/Shared Room */}
        {type !== "Room Rental" && type !== "Shared Room" && (
          <div className="basic-item">
            <div className="basic-info">
              <h3>Guests</h3>
            </div>
            <div className="basic-controls">
              <button
                type="button"
                onClick={() => updateCount("guestCount", guestCount, "decrease")}
                className="control-btn"
                disabled={guestCount <= 1}
              >
                -
              </button>
              <span className="count-display">{guestCount}</span>
              <button
                type="button"
                onClick={() => updateCount("guestCount", guestCount, "increase")}
                className="control-btn"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Bedroom count - only for entire place/house */}
        {type !== "Room Rental" && type !== "Shared Room" && (
          <div className="basic-item">
            <div className="basic-info">
              <h3>Bedrooms</h3>
            </div>
            <div className="basic-controls">
              <button
                type="button"
                onClick={() => updateCount("bedroomCount", bedroomCount, "decrease")}
                className="control-btn"
                disabled={bedroomCount <= 1}
              >
                -
              </button>
              <span className="count-display">{bedroomCount}</span>
              <button
                type="button"
                onClick={() => updateCount("bedroomCount", bedroomCount, "increase")}
                className="control-btn"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="basic-item">
          <div className="basic-info">
            <h3>Beds</h3>
          </div>
          <div className="basic-controls">
            <button
              type="button"
              onClick={() => updateCount("bedCount", bedCount, "decrease")}
              className="control-btn"
              disabled={bedCount <= 1}
            >
              -
            </button>
            <span className="count-display">{bedCount}</span>
            <button
              type="button"
              onClick={() => updateCount("bedCount", bedCount, "increase")}
              className="control-btn"
            >
              +
            </button>
          </div>
        </div>

        <div className="basic-item">
          <div className="basic-info">
            <h3>Bathrooms</h3>
          </div>
          <div className="basic-controls">
            <button
              type="button"
              onClick={() => updateCount("bathroomCount", bathroomCount, "decrease")}
              className="control-btn"
              disabled={bathroomCount <= 1}
            >
              -
            </button>
            <span className="count-display">{bathroomCount}</span>
            <button
              type="button"
              onClick={() => updateCount("bathroomCount", bathroomCount, "increase")}
              className="control-btn"
            >
              +
            </button>
          </div>
        </div>

        {/* Room Area - Only for Room Rental / Shared Room */}
        {(type === "Room Rental" || type === "Shared Room") && (
          <div className="basic-item">
            <div className="basic-info">
              <h3>Room Area (m²)</h3>
              <p>Approximate size of the room</p>
            </div>
            <div className="basic-controls input-control">
              <input
                type="number"
                min="0"
                value={roomArea}
                onChange={(e) => setValue("roomArea", Number(e.target.value), { shouldValidate: true })}
                className="area-input"
                style={{
                  width: '80px',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  textAlign: 'center',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateListingBasics;
