import re

filepath = "client/src/pages/host/CreateListing.jsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Add imports
imports = """
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listingSchema } from "../../utils/validations/listingSchema";
import CreateListingLocationForm from "../../components/host/CreateListingLocationForm";
import CreateListingBasics from "../../components/host/CreateListingBasics";
import CreateListingAmenitiesSelector from "../../components/host/CreateListingAmenitiesSelector";
import CreateListingPhotoUpload from "../../components/host/CreateListingPhotoUpload";
import CreateListingDescriptionForm from "../../components/host/CreateListingDescriptionForm";
import CreateListingPricing from "../../components/host/CreateListingPricing";
import CreateListingHostProfile from "../../components/host/CreateListingHostProfile";
"""
content = re.sub(r'import React from "react";', 'import React from "react";\n' + imports, content, count=1)

# 2. Add useForm hook initialization inside CreateListingPage
hook_init = """
  // INITIALIZE REACT-HOOK-FORM
  const methods = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      category: category,
      type: type,
      formLocation: formLocation,
      guestCount: guestCount,
      bedroomCount: bedroomCount,
      bedCount: bedCount,
      bathroomCount: bathroomCount,
      roomArea: roomArea,
      amenities: amenities,
      photos: photos,
      formDescription: formDescription,
      dailyPrice: dailyPrice,
      monthlyPrice: monthlyPrice,
      hostProfile: hostProfile,
      hostBio: hostBio,
    }
  });

  const onSubmit = async (data) => {
    // We will use `data` directly to ensure we use validated inputs
    // but we can also rely on Zustand store if needed.
    // For now, let's sync react-hook-form data back to Zustand before submitting
    setCategory(data.category);
    setType(data.type);
    setFormLocation(data.formLocation);
    setGuestCount(data.guestCount);
    setBedroomCount(data.bedroomCount);
    setBedCount(data.bedCount);
    setBathroomCount(data.bathroomCount);
    setRoomArea(data.roomArea);
    setAmenities(data.amenities);
    setPhotos(data.photos);
    setFormDescription(data.formDescription);
    setDailyPrice(data.dailyPrice);
    setMonthlyPrice(data.monthlyPrice);
    setHostProfile(data.hostProfile);
    setHostBio(data.hostBio);
    
    // Call original logic via a mock event
    await handleSubmit({ preventDefault: () => {} });
  };
"""
# find the line `const handleSubmit = async (e) => {`
content = content.replace("  const handleSubmit = async (e) => {", hook_init + "\n  const handleSubmit = async (e) => {")

# 3. Replace the form UI
form_start_marker = '<form onSubmit={handleSubmit} className="form-content">'
form_end_marker = '</form>'

form_replacement = """
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="form-content">
                
                {/* Step 1: Property Details */}
                <div className="step-section">
                  <div className="step-header">
                    <div className="step-number">1</div>
                    <h2>🏠 Tell us about your place</h2>
                  </div>
                  {type && (
                    <div className="selected-type-info">
                      <div className="info-label">Selected Property Type:</div>
                      <div className="selected-type-badge">
                        {types?.find(t => t.name === type)?.icon} <strong>{type}</strong>
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: "40px" }}>
                    <h3 className="section-title">Which category best describes your place?</h3>
                    <div className="categories-grid">
                      {categories?.filter(item => item.label !== "All").map((item, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setCategory(item.label);
                            methods.setValue("category", item.label, { shouldValidate: true });
                          }}
                          className={`category-item ${
                            category === item.label ? "selected" : ""
                          }`}
                        >
                          <div className="icon">{item.icon}</div>
                          <div className="content">
                            <h4>{item.label}</h4>
                            <p>{item.description || "Perfect for your listing"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <CreateListingLocationForm />
                <CreateListingBasics type={type} />
                <CreateListingAmenitiesSelector />
                <CreateListingPhotoUpload />
                <CreateListingDescriptionForm />
                <CreateListingPricing type={type} />
                {requiresHostProfile && <CreateListingHostProfile />}

                <button className="submit_btn" type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : isEditMode ? "Update Listing" : "Create Listing"}
                </button>
              </form>
            </FormProvider>
"""

# Extract everything before form and after form
start_idx = content.find(form_start_marker)
end_idx = content.find(form_end_marker, start_idx) + len(form_end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + form_replacement.strip() + content[end_idx:]
    with open(filepath, "w") as f:
        f.write(new_content)
    print("Successfully refactored CreateListing.jsx")
else:
    print("Could not find form start/end markers")
