import React from "react";
import "../../styles/CreateListing.scss";
import Navbar from "../../components/Navbar";
import { categories, types, facilities } from "../../data";
import { RemoveCircleOutline, AddCircleOutline } from "@mui/icons-material";
import variables from "../../styles/variables.scss";
import { useState } from "react";
import { IoIosImages } from "react-icons/io";
import { BiTrash } from "react-icons/bi";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Photo Item Component for drag and drop
const SortablePhotoItem = ({ photo, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `photo-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRemoveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Use nativeEvent if available for stopImmediatePropagation
    if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation();
    }
    onRemove(index);
  };

  return (
    <div ref={setNodeRef} style={style} className="photo">
      {/* Drag handle area - excludes the delete button */}
      <div
        className="photo-drag-handle"
        {...attributes}
        {...listeners}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: "40px", // Leave space for delete button
          bottom: 0,
          cursor: "move",
          zIndex: 1,
        }}
      />

      <img src={URL.createObjectURL(photo)} alt="place" />

      <button
        type="button"
        onClick={handleRemoveClick}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          zIndex: 20,
          pointerEvents: "auto",
        }}
      >
        <BiTrash />
      </button>
    </div>
  );
};
const CreateListingPage = () => {
  /*UPLOAD, DRAG AND DROP, REMOVE PHOTOS*/
  const [photos, setPhotos] = useState([]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleUploadPhotos = (e) => {
    const newPhotos = e.target.files;
    setPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]);
  };

  // Handle drag end for @dnd-kit
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setPhotos((items) => {
        const activeIndex = items.findIndex(
          (_, index) => `photo-${index}` === active.id
        );
        const overIndex = items.findIndex(
          (_, index) => `photo-${index}` === over.id
        );

        return arrayMove(items, activeIndex, overIndex);
      });
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setPhotos((prevPhotos) =>
      prevPhotos.filter((_, index) => index !== indexToRemove)
    );
  };

  return (
    <>
      <Navbar />
      <div className="create-listing">
        <h1>Publish Your Place</h1>
        <form>
          <div className="create-listing_step1">
            <h2>Step 1: Tell us about your place</h2>
            <hr />
            <h3>Which of these categories best describes your place?</h3>
            <div className="category-list">
              {categories?.map((item, index) => (
                <div className="category" key={index}>
                  <div className="category-icon">{item.icon}</div>
                  <p>{item.label}</p>
                </div>
              ))}
            </div>

            <h3>What type of place will guests have?</h3>
            <div className="type-list">
              {types?.map((item, index) => (
                <div className="type" key={index}>
                  <div className="type_text">
                    <h4>{item.name}</h4>
                    <p>{item.description}</p>
                  </div>
                  <div className="type_icon">{item.icon}</div>
                </div>
              ))}
            </div>

            <h3>Where's your place located?</h3>
            <div className="full">
              <div className="localtion">
                <p>Street Address</p>
                <input
                  type="text"
                  placeholder="Street Address"
                  name="streetAddress"
                  required
                />
              </div>
            </div>

            <div className="half">
              <div className="location">
                <p>Apartment, Suite, etc. (if applicable)</p>
                <input
                  type="text"
                  placeholder="Apartment, Suite, etc. (if applicable)"
                  name="aptSuite"
                />
              </div>
              <div className="location">
                <p>City</p>
                <input type="text" placeholder="City" name="city" required />
              </div>

              <div className="location">
                <p>Province</p>
                <input
                  type="text"
                  placeholder="Province"
                  name="province"
                  required
                />
              </div>
              <div className="location">
                <p>Country</p>
                <input
                  type="text"
                  placeholder="Country"
                  name="country"
                  required
                />
              </div>
            </div>

            <h3>Share some basics about your place</h3>
            <div className="basics">
              <div className="basic">
                <p>Guest</p>
                <div className="basic_count">
                  <RemoveCircleOutline
                    sx={{
                      fontSize: "25px",
                      cursor: "pointer",
                      "&:hover": {
                        color: variables.pinkred,
                      },
                    }}
                  />
                  <p>1</p>
                  <AddCircleOutline
                    sx={{
                      fontSize: "25px",
                      cursor: "pointer",
                      "&:hover": {
                        color: variables.pinkred,
                      },
                    }}
                  />
                </div>
              </div>

              <div className="basic">
                <p>Bedrooms</p>
                <div className="basic_count">
                  <RemoveCircleOutline
                    sx={{
                      fontSize: "25px",
                      cursor: "pointer",
                      "&:hover": {
                        color: variables.pinkred,
                      },
                    }}
                  />
                  <p>1</p>
                  <AddCircleOutline
                    sx={{
                      fontSize: "25px",
                      cursor: "pointer",
                      "&:hover": {
                        color: variables.pinkred,
                      },
                    }}
                  />
                </div>
              </div>
              <div className="basic">
                <p>Beds</p>
                <div className="basic_count">
                  <RemoveCircleOutline
                    sx={{
                      fontSize: "25px",
                      cursor: "pointer",
                      "&:hover": {
                        color: variables.pinkred,
                      },
                    }}
                  />
                  <p>1</p>
                  <AddCircleOutline
                    sx={{
                      fontSize: "25px",
                      cursor: "pointer",
                      "&:hover": {
                        color: variables.pinkred,
                      },
                    }}
                  />
                </div>
              </div>
              <div className="basic">
                <p>Bathrooms</p>
                <div className="basic_count">
                  <RemoveCircleOutline
                    sx={{
                      fontSize: "25px",
                      cursor: "pointer",
                      "&:hover": {
                        color: variables.pinkred,
                      },
                    }}
                  />
                  <p>1</p>
                  <AddCircleOutline
                    sx={{
                      fontSize: "25px",
                      cursor: "pointer",
                      "&:hover": {
                        color: variables.pinkred,
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="create-listing_step2">
            <h2>Step 2: Make your place stand out</h2>
            <hr />
            <h3>Tell guests what your place has to offer</h3>
            <div className="amenities">
              {facilities?.map((item, index) => (
                <div className="facility" key={index}>
                  <div className="facility_icon">{item.icon}</div>
                </div>
              ))}
            </div>
            <h3>Add some photos of your place</h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="photos">
                {photos.length < 1 && (
                  <>
                    <input
                      id="image"
                      type="file"
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={handleUploadPhotos}
                      multiple
                    />
                    <label htmlFor="image" className="alone">
                      <div className="icon">
                        <IoIosImages />
                      </div>
                      <p>Upload from your device</p>
                    </label>
                  </>
                )}
                {photos.length >= 1 && (
                  <>
                    <SortableContext
                      items={photos.map((_, index) => `photo-${index}`)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {photos.map((photo, index) => (
                        <SortablePhotoItem
                          key={`photo-${index}`}
                          photo={photo}
                          index={index}
                          onRemove={handleRemovePhoto}
                        />
                      ))}
                    </SortableContext>
                    <input
                      id="image"
                      type="file"
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={handleUploadPhotos}
                      multiple
                    />
                    <label htmlFor="image" className="together">
                      <div className="icon">
                        <IoIosImages />
                      </div>
                      <p>Upload from your device</p>
                    </label>
                  </>
                )}
              </div>
            </DndContext>

            <h3>What make your place attractive and exciting?</h3>
            <div className="description">
              <p>Title</p>
              <input type="text" placeholder="Title" name="title" required />
              <p>Description</p>
              <input
                type="text"
                placeholder="Description"
                name="description"
                required
              />
              <p>Highlight</p>
              <input
                type="text"
                placeholder="Highlight"
                name="highlight"
                required
              />
              <p>Highlight details</p>
              <input
                type="text"
                placeholder="Highlight details"
                name="highlightDesc"
                required
              />
              <p>Now, set your PRICE</p>
              <span>$</span>
              <input
                type="number"
                placeholder="100"
                name="price"
                className="price"
                required
              />
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateListingPage;
