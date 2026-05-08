import React from "react";
import { useFormContext } from "react-hook-form";

const CreateListingLocationForm = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="step-section">
      <div className="step-header">
        <div className="step-number">2</div>
        <h2>📍 Where's your place located?</h2>
      </div>

      <div className="location-grid">
        <div className="full-width form-group">
          <label>🏠 Street Address</label>
          <input
            type="text"
            placeholder="Enter your street address"
            {...register("formLocation.streetAddress")}
            className={errors.formLocation?.streetAddress ? "error" : ""}
          />
          {errors.formLocation?.streetAddress && <span className="field-error" style={{color:"red"}}>{errors.formLocation.streetAddress.message}</span>}
        </div>

        <div className="form-group">
          <label>🏢 Apartment, Suite (Optional)</label>
          <input
            type="text"
            placeholder="Apt, Suite, etc."
            {...register("formLocation.aptSuite")}
          />
        </div>

        <div className="form-group">
          <label>🏙️ City</label>
          <input
            type="text"
            placeholder="Enter city"
            {...register("formLocation.city")}
            className={errors.formLocation?.city ? "error" : ""}
          />
          {errors.formLocation?.city && <span className="field-error" style={{color:"red"}}>{errors.formLocation.city.message}</span>}
        </div>

        <div className="form-group">
          <label>🗺️ Province/State</label>
          <input
            type="text"
            placeholder="Enter province/state"
            {...register("formLocation.province")}
            className={errors.formLocation?.province ? "error" : ""}
          />
          {errors.formLocation?.province && <span className="field-error" style={{color:"red"}}>{errors.formLocation.province.message}</span>}
        </div>

        <div className="form-group">
          <label>🌍 Country</label>
          <input
            type="text"
            placeholder="Enter country"
            {...register("formLocation.country")}
            className={errors.formLocation?.country ? "error" : ""}
          />
          {errors.formLocation?.country && <span className="field-error" style={{color:"red"}}>{errors.formLocation.country.message}</span>}
        </div>
      </div>
    </div>
  );
};

export default CreateListingLocationForm;
