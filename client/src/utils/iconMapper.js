// Icon mapping for static data from database
import { TbBeach, TbMountain, TbPool, TbIroning3 } from "react-icons/tb";
import {
  GiBarn,
  GiBoatFishing,
  GiCactus,
  GiCastle,
  GiCaveEntrance,
  GiForestCamp,
  GiIsland,
  GiWindmill,
  GiHeatHaze,
  GiCctvCamera,
  GiBarbecue,
  GiToaster,
  GiCampfire,
} from "react-icons/gi";
import {
  FaSkiing,
  FaPumpSoap,
  FaShower,
  FaFireExtinguisher,
  FaUmbrellaBeach,
  FaKey,
} from "react-icons/fa";
import { FaHouseUser, FaPeopleRoof, FaKitchenSet } from "react-icons/fa6";
import {
  BiSolidWasher,
  BiSolidDryer,
  BiSolidFirstAid,
  BiWifi,
  BiSolidFridge,
  BiWorld,
} from "react-icons/bi";
import { BsSnow, BsFillDoorOpenFill, BsPersonWorkspace } from "react-icons/bs";
import { IoDiamond } from "react-icons/io5";
import {
  MdOutlineVilla,
  MdMicrowave,
  MdBalcony,
  MdYard,
  MdPets,
} from "react-icons/md";
import {
  PiBathtubFill,
  PiCoatHangerFill,
  PiTelevisionFill,
} from "react-icons/pi";
import { AiFillCar } from "react-icons/ai";

/**
 * Icon mapping object
 * Maps icon name strings from database to actual React Icon components
 */
const iconMap = {
  // Categories
  BiWorld,
  TbBeach,
  GiWindmill,
  MdOutlineVilla,
  TbMountain,
  TbPool,
  GiIsland,
  GiBoatFishing,
  FaSkiing,
  GiCastle,
  GiCaveEntrance,
  GiForestCamp,
  BsSnow,
  GiCactus,
  GiBarn,
  IoDiamond,

  // Property Types
  FaHouseUser,
  BsFillDoorOpenFill,
  FaPeopleRoof,

  // Facilities
  PiBathtubFill,
  FaPumpSoap,
  FaShower,
  BiSolidWasher,
  BiSolidDryer,
  PiCoatHangerFill,
  TbIroning3,
  PiTelevisionFill,
  BsPersonWorkspace,
  GiHeatHaze,
  GiCctvCamera,
  FaFireExtinguisher,
  BiSolidFirstAid,
  BiWifi,
  FaKitchenSet,
  BiSolidFridge,
  MdMicrowave,
  GiToaster,
  GiBarbecue,
  FaUmbrellaBeach,
  MdBalcony,
  GiCampfire,
  MdYard,
  AiFillCar,
  FaKey,
  MdPets,
};

/**
 * Get React Icon component from icon name string
 * @param {string} iconName - Name of the icon (e.g., "TbBeach", "FaHouseUser")
 * @returns {JSX.Element} - React Icon JSX element
 */
export const getIcon = (iconName) => {
  const IconComponent = iconMap[iconName] || BiWorld;
  return <IconComponent />; // Return JSX element, not component reference
};

