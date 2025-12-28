import { ListingStatus, PropertyType } from './types';

/**
 * Listing Model
 * Represents a property listing
 */
export class Listing {
  constructor({
    id = null,
    creator = null,
    category = '',
    type = '',
    streetAddress = '',
    aptSuite = '',
    city = '',
    province = '',
    country = '',
    guestCount = 0,
    bedroomCount = 0,
    bedCount = 0,
    bathroomCount = 0,
    amenities = [],
    listingPhotoPaths = [],
    title = '',
    description = '',
    highlight = '',
    highlightDesc = '',
    price = 0,
    status = ListingStatus.ACTIVE,
    // Computed/populated
    averageRating = 0,
    reviewCount = 0,
    // Host profile (for Room/Shared Room types)
    hostProfile = null,
  } = {}) {
    this.id = id;
    this.creator = creator;
    this.category = category;
    this.type = type;
    this.streetAddress = streetAddress;
    this.aptSuite = aptSuite;
    this.city = city;
    this.province = province;
    this.country = country;
    this.guestCount = guestCount;
    this.bedroomCount = bedroomCount;
    this.bedCount = bedCount;
    this.bathroomCount = bathroomCount;
    this.amenities = amenities;
    this.listingPhotoPaths = listingPhotoPaths;
    this.title = title;
    this.description = description;
    this.highlight = highlight;
    this.highlightDesc = highlightDesc;
    this.price = price;
    this.status = status;
    this.averageRating = averageRating;
    this.reviewCount = reviewCount;
    this.hostProfile = hostProfile;
  }

  // Computed properties
  get fullAddress() {
    const parts = [
      this.aptSuite,
      this.streetAddress,
      this.city,
      this.province,
      this.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  get shortAddress() {
    return `${this.city}, ${this.country}`;
  }

  get isEntirePlace() {
    return this.type === PropertyType.ENTIRE_PLACE;
  }

  get isRoom() {
    return this.type === PropertyType.ROOM;
  }

  get isSharedRoom() {
    return this.type === PropertyType.SHARED_ROOM;
  }

  get requiresHostProfile() {
    return this.isRoom || this.isSharedRoom;
  }

  get isActive() {
    return this.status === ListingStatus.ACTIVE;
  }

  get isInactive() {
    return this.status === ListingStatus.INACTIVE;
  }

  get formattedPrice() {
    return this.price.toLocaleString('vi-VN');
  }

  get mainPhoto() {
    return this.listingPhotoPaths?.[0] || null;
  }

  get hasReviews() {
    return this.reviewCount > 0;
  }

  get ratingStars() {
    return Math.round(this.averageRating * 2) / 2; // Round to nearest 0.5
  }

  // Static factory method
  static fromApiResponse(data) {
    if (!data) return null;

    return new Listing({
      id: data._id || data.id,
      creator: data.creator,
      category: data.category || '',
      type: data.type || '',
      streetAddress: data.streetAddress || '',
      aptSuite: data.aptSuite || '',
      city: data.city || '',
      province: data.province || '',
      country: data.country || '',
      guestCount: data.guestCount || 0,
      bedroomCount: data.bedroomCount || 0,
      bedCount: data.bedCount || 0,
      bathroomCount: data.bathroomCount || 0,
      amenities: data.amenities || [],
      listingPhotoPaths: data.listingPhotoPaths || [],
      title: data.title || '',
      description: data.description || '',
      highlight: data.highlight || '',
      highlightDesc: data.highlightDesc || '',
      price: data.price || 0,
      status: data.status || ListingStatus.ACTIVE,
      averageRating: data.averageRating || 0,
      reviewCount: data.reviewCount || 0,
      hostProfile: data.hostProfile,
    });
  }

  // Convert to API payload
  toApiPayload() {
    return {
      creator: this.creator,
      category: this.category,
      type: this.type,
      streetAddress: this.streetAddress,
      aptSuite: this.aptSuite,
      city: this.city,
      province: this.province,
      country: this.country,
      guestCount: this.guestCount,
      bedroomCount: this.bedroomCount,
      bedCount: this.bedCount,
      bathroomCount: this.bathroomCount,
      amenities: this.amenities,
      listingPhotoPaths: this.listingPhotoPaths,
      title: this.title,
      description: this.description,
      highlight: this.highlight,
      highlightDesc: this.highlightDesc,
      price: this.price,
      status: this.status,
      hostProfile: this.hostProfile,
    };
  }

  // Clone
  clone() {
    return new Listing({
      id: this.id,
      creator: this.creator,
      category: this.category,
      type: this.type,
      streetAddress: this.streetAddress,
      aptSuite: this.aptSuite,
      city: this.city,
      province: this.province,
      country: this.country,
      guestCount: this.guestCount,
      bedroomCount: this.bedroomCount,
      bedCount: this.bedCount,
      bathroomCount: this.bathroomCount,
      amenities: [...this.amenities],
      listingPhotoPaths: [...this.listingPhotoPaths],
      title: this.title,
      description: this.description,
      highlight: this.highlight,
      highlightDesc: this.highlightDesc,
      price: this.price,
      status: this.status,
      averageRating: this.averageRating,
      reviewCount: this.reviewCount,
      hostProfile: this.hostProfile,
    });
  }
}

export default Listing;

