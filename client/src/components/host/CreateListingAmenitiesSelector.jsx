import React from "react";
import { useFormContext } from "react-hook-form";
import { facilities } from "../../data";

const CreateListingAmenitiesSelector = () => {
  const { watch, setValue, formState: { errors } } = useFormContext();
  const amenities = watch("amenities") || [];

  const handleSelectAmenities = (facilityName) => {
    if (amenities.includes(facilityName)) {
      setValue("amenities", amenities.filter((item) => item !== facilityName), { shouldValidate: true });
    } else {
      setValue("amenities", [...amenities, facilityName], { shouldValidate: true });
    }
  };

  return (
    <div className="step-section">
      <div className="step-header">
        <div className="step-number">4</div>
        <h2>✨ Tell guests what your place has to offer</h2>
      </div>
      
      <div className="amenities-grid">
        {facilities?.map((item, index) => (
          <div
            className={`amenity-item ${
              amenities.includes(item.name) ? "selected" : ""
            }`}
            key={index}
            onClick={() => handleSelectAmenities(item.name)}
          >
            <div className="amenity-icon">{item.icon}</div>
            <p>{item.name}</p>
          </div>
        ))}
      </div>
      {errors.amenities && <p className="error-message" style={{color: "red", marginTop: "10px"}}>{errors.amenities.message}</p>}
    </div>
  );
};

export default CreateListingAmenitiesSelector;
