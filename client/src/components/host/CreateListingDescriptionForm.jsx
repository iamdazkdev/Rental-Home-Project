import React from "react";
import { useFormContext } from "react-hook-form";

const CreateListingDescriptionForm = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="step-section">
      <div className="step-header">
        <div className="step-number">6</div>
        <h2>📝 Describe your place</h2>
      </div>

      <div className="description-container">
        <div className="form-group full-width">
          <label>Title</label>
          <input
            type="text"
            placeholder="Short, catchy title"
            {...register("formDescription.title")}
            className={errors.formDescription?.title ? "error" : ""}
          />
          {errors.formDescription?.title && <span className="field-error" style={{color:"red"}}>{errors.formDescription.title.message}</span>}
        </div>

        <div className="form-group full-width">
          <label>Description</label>
          <textarea
            placeholder="Tell guests about your space, neighborhood, and what makes it special"
            {...register("formDescription.description")}
            className={`description-textarea ${errors.formDescription?.description ? "error" : ""}`}
            rows="6"
          />
          {errors.formDescription?.description && <span className="field-error" style={{color:"red"}}>{errors.formDescription.description.message}</span>}
        </div>

        <div className="form-group full-width">
          <label>Highlight Title</label>
          <input
            type="text"
            placeholder="e.g., Central Location, Pool Access"
            {...register("formDescription.highlight")}
            className={errors.formDescription?.highlight ? "error" : ""}
          />
          {errors.formDescription?.highlight && <span className="field-error" style={{color:"red"}}>{errors.formDescription.highlight.message}</span>}
        </div>

        <div className="form-group full-width">
          <label>Highlight Description</label>
          <textarea
            placeholder="Detail your highlight"
            {...register("formDescription.highlightDesc")}
            className={`description-textarea ${errors.formDescription?.highlightDesc ? "error" : ""}`}
            rows="3"
          />
          {errors.formDescription?.highlightDesc && <span className="field-error" style={{color:"red"}}>{errors.formDescription.highlightDesc.message}</span>}
        </div>
      </div>
    </div>
  );
};

export default CreateListingDescriptionForm;
