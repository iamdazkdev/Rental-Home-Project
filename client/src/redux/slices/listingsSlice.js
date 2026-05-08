import { createSlice } from "@reduxjs/toolkit";
import { setUser, clearUser } from "./userSlice";

const initialState = {
  listings: [],
  tripList: [],
  wishList: [],
  propertyList: [],
  reservationList: [],
};

export const listingsSlice = createSlice({
  name: "listings",
  initialState,
  reducers: {
    setListings: (state, action) => {
      state.listings = action.payload;
    },
    setTripList: (state, action) => {
      state.tripList = action.payload;
    },
    setWishList: (state, action) => {
      state.wishList = action.payload;
    },
    setPropertyList: (state, action) => {
      state.propertyList = action.payload;
    },
    setReservationList: (state, action) => {
      state.reservationList = action.payload;
    },
    clearAllLists: (state) => {
      state.tripList = [];
      state.wishList = [];
      state.propertyList = [];
      state.reservationList = [];
    }
  },
  extraReducers: (builder) => {
    builder.addCase(setUser, (state, action) => {
      const user = action.payload;
      if (user) {
        state.tripList = user.tripList || [];
        state.wishList = user.wishList || [];
        state.propertyList = user.propertyList || [];
        state.reservationList = user.reservationList || [];
      }
    });
    builder.addCase(clearUser, (state) => {
      state.tripList = [];
      state.wishList = [];
      state.propertyList = [];
      state.reservationList = [];
    });
  }
});

export const {
  setListings,
  setTripList,
  setWishList,
  setPropertyList,
  setReservationList,
  clearAllLists
} = listingsSlice.actions;
export default listingsSlice.reducer;
