export interface Facility {
    id: string;
    name: string;
    description: string;
    openingHours: string;
    location: string;
    isBookedByMember: boolean; // maybe to show some kind of green check and "booked" or something if the person has already booked it??? or to quickly fetch member bookings for some later purpose??? but maybe just keep bookings in a "Member" data structure since we need to show booking history anyway 
    bookedSlots: string[]; 

    /* note to self - potential fields to add later:
    - capacity: number; // for facilities that have a maximum capacity
    - images: string[]; // URLs of images for the facility
    - amenities: string[]; (might be fine to assume this would be in desc)
    - bookingRequests: BookingRequest[] (maybe make this a separate type since it will have a time and user and maybe more?); // if we want to show pending booking requests for staff/admins
    */

    // TODO: note to self - add or remove or adjust these fields based on spec soon but have these as placeholder values for now
}