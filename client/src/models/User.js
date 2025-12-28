/**
 * User Model
 * Represents a user in the system
 */
export class User {
  constructor({
    id = null,
    firstName = '',
    lastName = '',
    email = '',
    profileImagePath = null,
    tripList = [],
    wishList = [],
    propertyList = [],
    reservationList = [],
    // Host-specific fields
    hostProfile = null,
  } = {}) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.profileImagePath = profileImagePath;
    this.tripList = tripList;
    this.wishList = wishList;
    this.propertyList = propertyList;
    this.reservationList = reservationList;
    this.hostProfile = hostProfile;
  }

  // Computed properties
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  get initials() {
    return `${this.firstName[0] || ''}${this.lastName[0] || ''}`.toUpperCase();
  }

  get isHost() {
    return this.propertyList && this.propertyList.length > 0;
  }

  get hasTrips() {
    return this.tripList && this.tripList.length > 0;
  }

  get hasWishlist() {
    return this.wishList && this.wishList.length > 0;
  }

  // Static factory method
  static fromApiResponse(data) {
    if (!data) return null;

    return new User({
      id: data._id || data.id,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      profileImagePath: data.profileImagePath,
      tripList: data.tripList || [],
      wishList: data.wishList || [],
      propertyList: data.propertyList || [],
      reservationList: data.reservationList || [],
      hostProfile: data.hostProfile,
    });
  }

  // Convert to API payload
  toApiPayload() {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      profileImagePath: this.profileImagePath,
    };
  }

  // Clone
  clone() {
    return new User({
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      profileImagePath: this.profileImagePath,
      tripList: [...this.tripList],
      wishList: [...this.wishList],
      propertyList: [...this.propertyList],
      reservationList: [...this.reservationList],
      hostProfile: this.hostProfile,
    });
  }
}

export default User;

