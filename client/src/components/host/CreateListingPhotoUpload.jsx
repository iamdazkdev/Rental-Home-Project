import React, { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const CreateListingPhotoUpload = () => {
  const { watch, setValue, formState: { errors } } = useFormContext();
  const photos = watch("photos") || [];

  const handleUploadPhotos = (e) => {
    const newPhotos = e.target.files;
    setValue("photos", [...photos, ...newPhotos], { shouldValidate: true });
  };

  const handleDragPhoto = (result) => {
    if (!result.destination) return;
    const items = Array.from(photos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setValue("photos", items, { shouldValidate: true });
  };

  const handleRemovePhoto = (indexToRemove) => {
    setValue(
      "photos",
      photos.filter((_, index) => index !== indexToRemove),
      { shouldValidate: true }
    );
  };

  return (
    <div className="step-section">
      <div className="step-header">
        <div className="step-number">5</div>
        <h2>📸 Add some photos of your place</h2>
      </div>

      <p className="section-subtitle">
        You'll need 3 photos to get started. You can add more or make
        changes later.
      </p>

      <div className="photos-container">
        <DragDropContext onDragEnd={handleDragPhoto}>
          <Droppable droppableId="photos" direction="horizontal">
            {(provided) => (
              <div
                className="photos-grid"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {photos.length >= 1 &&
                  photos.map((photo, index) => {
                    return (
                      <Draggable
                        key={index.toString()}
                        draggableId={index.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            className={`photo-wrapper ${
                              snapshot.isDragging ? "dragging" : ""
                            } ${index === 0 ? "featured-photo" : ""}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <div className="photo-controls-top">
                              <span className="photo-number">{index + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(index)}
                                className="delete-btn"
                              >
                                🗑️
                              </button>
                            </div>
                            <img
                              src={photo instanceof File ? URL.createObjectURL(photo) : photo}
                              alt={`place ${index}`}
                              className="uploaded-photo"
                            />
                            <div
                              {...provided.dragHandleProps}
                              className="drag-handle"
                            >
                              <div className="drag-handle-pill">
                                <span className="drag-dots">⋮⋮</span>
                                <span className="drag-text">
                                  {index === 0 ? "Cover Photo" : "Drag"}
                                </span>
                              </div>
                            </div>
                            {index === 0 && <div className="featured-badge">⭐ Cover Photo</div>}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                {provided.placeholder}

                <div className="upload-box">
                  <input
                    id="image"
                    type="file"
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleUploadPhotos}
                    multiple
                  />
                  <label htmlFor="image" className="upload-label">
                    <div className="upload-icon-wrapper">
                      <div className="upload-icon">📸</div>
                    </div>
                    <p className="upload-text">Upload Photos</p>
                    <p className="upload-hint">or drag and drop</p>
                    <div className="upload-button-small">Browse</div>
                  </label>
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {errors.photos && <p className="error-message" style={{color: "red", marginTop: "10px"}}>{errors.photos.message}</p>}
    </div>
  );
};

export default CreateListingPhotoUpload;
