import { useState } from "react";
import Navbar from "../../components/Navbar";
import Slide from "../../components/Slide";
import Categories from "../../components/Categories";
import Types from "../../components/Types";
import Listing from "../../components/Listing";

const HomePage = () => {
  const [selectedType, setSelectedType] = useState(null);

  const handleTypeSelect = (typeName) => {
    setSelectedType(typeName);
  };

  return (
    <>
      <Navbar />
      <Slide />
      <Types selectedType={selectedType} onTypeSelect={handleTypeSelect} />
      <Categories />
      <Listing selectedType={selectedType} />
    </>
  );
};

export default HomePage;
