import { create } from 'zustand';

const useSearchStore = create((set) => ({
  mode: 'short_term',
  longTermData: {
    duration: 1,
    isFlexible: false,
    exactDate: '',
    flexibleMonths: [],
  },
  filters: {
    query: '',
    city: '',
    province: '',
    country: '',
    category: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    minGuests: '',
    minBedrooms: '',
    minBathrooms: '',
    amenities: [],
    minRating: '',
    sortBy: 'rating',
    page: 1,
  },
  
  setMode: (mode) => set({ mode }),
  
  setLongTermData: (data) => set((state) => ({
    longTermData: { ...state.longTermData, ...data }
  })),

  setFilters: (data) => set((state) => ({
    filters: { ...state.filters, ...data, page: data.page || state.filters.page }
  })),

  toggleAmenity: (amenity) => set((state) => ({
    filters: {
      ...state.filters,
      amenities: state.filters.amenities.includes(amenity)
        ? state.filters.amenities.filter(a => a !== amenity)
        : [...state.filters.amenities, amenity],
      page: 1
    }
  })),

  clearFilters: () => set((state) => ({
    filters: {
      ...state.filters,
      query: '', city: '', province: '', country: '', category: '', type: '',
      minPrice: '', maxPrice: '', minGuests: '', minBedrooms: '', minBathrooms: '',
      amenities: [], minRating: '', sortBy: 'rating', page: 1
    }
  }))
}));

export default useSearchStore;
