import { create } from "zustand";

const initialFormState = {
  category: "",
  type: "",
  formLocation: {
    streetAddress: "",
    aptSuite: "",
    city: "",
    province: "",
    country: "",
  },
  guestCount: 1,
  bedroomCount: 1,
  bedCount: 1,
  bathroomCount: 1,
  roomArea: 0,
  amenities: [],
  photos: [],
  photoWarning: "",
  formDescription: {
    title: "",
    description: "",
    highlight: "",
    highlightDesc: "",
    price: 0,
  },
  dailyPrice: 0,
  monthlyPrice: 0,
  hostProfile: {
    sleepSchedule: "",
    smoking: "",
    personality: "",
    cleanliness: "",
    occupation: "",
    hobbies: "",
    houseRules: "",
    additionalInfo: "",
  },
  hostBio: "",
};

export const useCreateListingStore = create((set) => ({
  ...initialFormState,
  
  // Setters
  setCategory: (category) => set({ category }),
  setType: (type) => set({ type }),
  setFormLocation: (locationData) => set({ formLocation: locationData }),
  setGuestCount: (guestCount) => set({ guestCount }),
  setBedroomCount: (bedroomCount) => set({ bedroomCount }),
  setBedCount: (bedCount) => set({ bedCount }),
  setBathroomCount: (bathroomCount) => set({ bathroomCount }),
  setRoomArea: (roomArea) => set({ roomArea }),
  setAmenities: (amenities) => set({ amenities }),
  setPhotos: (photos) => set({ photos }),
  setPhotoWarning: (warning) => set({ photoWarning: warning }),
  setFormDescription: (descData) => set({ formDescription: descData }),
  setDailyPrice: (price) => set({ dailyPrice: price }),
  setMonthlyPrice: (price) => set({ monthlyPrice: price }),
  setHostProfile: (profileData) => set({ hostProfile: profileData }),
  setHostBio: (bio) => set({ hostBio: bio }),
  
  // Handlers
  updateFormLocation: (e) => set((state) => ({
    formLocation: {
      ...state.formLocation,
      [e.target.name]: e.target.value
    }
  })),
  
  updateFormDescription: (e) => set((state) => ({
    formDescription: {
      ...state.formDescription,
      [e.target.name]: e.target.value
    }
  })),
  
  updateHostProfile: (e) => set((state) => ({
    hostProfile: {
      ...state.hostProfile,
      [e.target.name]: e.target.value
    }
  })),
  
  toggleAmenity: (facility) => set((state) => {
    if (state.amenities.includes(facility)) {
      return { amenities: state.amenities.filter((f) => f !== facility) };
    } else {
      return { amenities: [...state.amenities, facility] };
    }
  }),
  
  // Reset
  clearStore: () => set(initialFormState),
}));
