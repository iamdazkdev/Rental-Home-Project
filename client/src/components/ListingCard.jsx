/* eslint-disable jsx-a11y/img-redundant-alt */
import "../styles/ListingCard.scss";
import { CONFIG } from "../constants/api";
import { ArrowForwardIos, ArrowBackIosNew } from "@mui/icons-material";
import { useState } from "react";
const ListingCard = ({
  listingId,
  creator,
  listingPhotoPaths,
  city,
  province,
  country,
  category,
  type,
  price,
}) => {
  /* SLIDER FOR IMAGES */
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevSlide = () => {
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + listingPhotoPaths.length) % listingPhotoPaths.length
    );
  };

  const goToNextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % listingPhotoPaths.length);
  };
  // return (
  //   <div className="listing_card">
  //     <div className="slider-container">
  //       <div className="slider" style={{ transform: `tran` }}>
  //         {listingPhotoPaths.map((photo, index) => (
  //           <div className="slide" key={index}>
  //             <img
  //               src={`${CONFIG.API_BASE_URL}/${photo.replace("public/", "")}`}
  //               alt={`photo ${index + 1}`}
  //             />

  //             <div
  //               className="prev-button"
  //               onClick={(e) => {
  //                 goToPrevSlide(e);
  //               }}
  //             >
  //               <ArrowBackIosNew sx={{ fontSize: "15px" }} />
  //             </div>
  //             <div
  //               className="next-button"
  //               onClick={(e) => {
  //                 goToNextSlide(e);
  //               }}
  //             >
  //               <ArrowForwardIos sx={{ fontSize: "15px" }} />
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   </div>
  // );
  return (
    <div
      className="listing-card"
      // onClick={() => {
      //   navigate(`/properties/${listingId}`);
      // }}
    >
      <div className="slider-container">
        <div
          className="slider"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {listingPhotoPaths?.map((photo, index) => (
            <div key={index} className="slide">
              <img
                src={(() => {
                  console.log("ListingCard Image Debug:");
                  // Check if it's already a full Cloudinary URL
                  if (photo?.startsWith("https://")) {
                    console.log("- Using Cloudinary URL directly:", photo);
                    return photo;
                  }

                  // Legacy local path handling
                  const localPath = `${CONFIG.API_BASE_URL}/${
                    photo?.replace("public/", "") || ""
                  }`;
                  console.log("- Using local path:", localPath);
                  return localPath;
                })()}
                alt={`photo ${index + 1}`}
              />
              <div
                className="prev-button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevSlide(e);
                }}
              >
                <ArrowBackIosNew sx={{ fontSize: "15px" }} />
              </div>
              <div
                className="next-button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextSlide(e);
                }}
              >
                <ArrowForwardIos sx={{ fontSize: "15px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <h3>
        {city}, {province}, {country}
      </h3>
      <p>{category}</p>
      <p>{type}</p>
      <p>
        <span>${price}</span>
        &nbsp;per night
      </p>
    </div>
  );
};

export default ListingCard;
