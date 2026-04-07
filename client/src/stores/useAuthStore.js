import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  listings: [],
  
  setLogin: (user, token) => set({ user, token }),
  setLogout: () => set({ user: null, token: null }),
  setListings: (listings) => set({ listings }),
  
  setTripList: (tripList) => set((state) => ({
    user: state.user ? { ...state.user, tripList } : null
  })),
  
  setWishList: (wishList) => set((state) => ({
    user: state.user ? { ...state.user, wishList } : null
  })),
  
  setPropertyList: (propertyList) => set((state) => ({
    user: state.user ? { ...state.user, propertyList } : null
  })),
  
  setReservationList: (reservationList) => set((state) => ({
    user: state.user ? { ...state.user, reservationList } : null
  })),
}));

export default useAuthStore;
