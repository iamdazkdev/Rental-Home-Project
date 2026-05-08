import React from "react";
import { useFormContext } from "react-hook-form";

const CreateListingPricing = ({ type }) => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="step-section">
      <div className="step-header">
        <div className="step-number">7</div>
        <h2>💰 Set your price</h2>
      </div>

      <div className="pricing-container">
        {/* If Room Rental/Shared Room, show both Daily and Monthly */}
        {(type === "Room Rental" || type === "Shared Room") ? (
          <div className="pricing-split">
            <div className="price-card">
              <label>Daily Price</label>
              <div className="price-input-wrapper">
                <span className="currency-symbol">₫</span>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  {...register("dailyPrice", { valueAsNumber: true })}
                  className={`price-input ${errors.dailyPrice ? "error" : ""}`}
                />
              </div>
              <p className="price-hint">Best for short stays</p>
              {errors.dailyPrice && <span className="field-error" style={{color:"red"}}>{errors.dailyPrice.message}</span>}
            </div>

            <div className="price-card highlighted">
              <label>Monthly Price</label>
              <div className="price-input-wrapper">
                <span className="currency-symbol">₫</span>
                <input
                  type="number"
                  placeholder="e.g. 5000000"
                  {...register("monthlyPrice", { valueAsNumber: true })}
                  className={`price-input ${errors.monthlyPrice ? "error" : ""}`}
                />
              </div>
              <p className="price-hint">Best for long-term roommates</p>
              {errors.monthlyPrice && <span className="field-error" style={{color:"red"}}>{errors.monthlyPrice.message}</span>}
            </div>
          </div>
        ) : (
          <div className="price-card full-width">
            <label>Price per night</label>
            <div className="price-input-wrapper">
              <span className="currency-symbol">₫</span>
              <input
                type="number"
                placeholder="0"
                {...register("formDescription.price", { valueAsNumber: true })}
                className={`price-input ${errors.formDescription?.price ? "error" : ""}`}
              />
            </div>
            {errors.formDescription?.price && <span className="field-error" style={{color:"red"}}>{errors.formDescription.price.message}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateListingPricing;
