import React from "react";
import { useFormContext } from "react-hook-form";

const CreateListingHostProfile = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="step-section roommate-profile-section">
      <div className="step-header">
        <div className="step-number">8</div>
        <h2>👥 Roommate Match Profile</h2>
      </div>
      
      <p className="section-subtitle">
        Help potential roommates know if you're a good match.
      </p>

      <div className="profile-grid">
        <div className="form-group">
          <label>Sleep Schedule</label>
          <select {...register("hostProfile.sleepSchedule")} className={errors.hostProfile?.sleepSchedule ? "error" : ""}>
            <option value="">Select...</option>
            <option value="early_bird">Early Bird (Sleep early, wake early)</option>
            <option value="night_owl">Night Owl (Sleep late, wake late)</option>
            <option value="flexible">Flexible / Mixed</option>
          </select>
          {errors.hostProfile?.sleepSchedule && <span className="field-error" style={{color:"red"}}>{errors.hostProfile.sleepSchedule.message}</span>}
        </div>

        <div className="form-group">
          <label>Smoking Preference</label>
          <select {...register("hostProfile.smoking")} className={errors.hostProfile?.smoking ? "error" : ""}>
            <option value="">Select...</option>
            <option value="no">Strictly Non-Smoking</option>
            <option value="outside_only">Outside Only</option>
            <option value="yes">Smoking Allowed</option>
          </select>
          {errors.hostProfile?.smoking && <span className="field-error" style={{color:"red"}}>{errors.hostProfile.smoking.message}</span>}
        </div>

        <div className="form-group">
          <label>Personality</label>
          <select {...register("hostProfile.personality")} className={errors.hostProfile?.personality ? "error" : ""}>
            <option value="">Select...</option>
            <option value="introvert">Introvert (Value quiet/alone time)</option>
            <option value="extrovert">Extrovert (Love socializing)</option>
            <option value="ambivert">Ambivert (A bit of both)</option>
          </select>
          {errors.hostProfile?.personality && <span className="field-error" style={{color:"red"}}>{errors.hostProfile.personality.message}</span>}
        </div>

        <div className="form-group">
          <label>Cleanliness</label>
          <select {...register("hostProfile.cleanliness")} className={errors.hostProfile?.cleanliness ? "error" : ""}>
            <option value="">Select...</option>
            <option value="very_clean">Very Clean (Clean daily/weekly)</option>
            <option value="moderate">Moderate (Clean when needed)</option>
            <option value="relaxed">Relaxed (Not a priority)</option>
          </select>
          {errors.hostProfile?.cleanliness && <span className="field-error" style={{color:"red"}}>{errors.hostProfile.cleanliness.message}</span>}
        </div>
      </div>

      <div className="form-group full-width" style={{ marginTop: '20px' }}>
        <label>About Me (Bio)</label>
        <textarea
          placeholder="Tell future roommates about yourself..."
          {...register("hostBio")}
          className={`description-textarea ${errors.hostBio ? "error" : ""}`}
          rows="4"
        />
        {errors.hostBio && <span className="field-error" style={{color:"red"}}>{errors.hostBio.message}</span>}
      </div>
    </div>
  );
};

export default CreateListingHostProfile;
