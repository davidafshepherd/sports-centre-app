import FacilityGrid from "@/components/features/FacilityGrid";
import { Facility } from "@/types";

// TODO: replace with real facilities created by an admin
const mockFacilities: Facility[] = [
    {
        id: "1",
        name: "Badminton Court",
        description: "...",
        openingHours: "9am - 9pm",
        location: "Building A",
        isBookedByMember: false,
        bookedSlots: [],
    },
    {
        id: "2",
        name: "Football Pitch",
        description: "...",
        openingHours: "10am - 8pm",
        location: "Building B",
        isBookedByMember: true,
        bookedSlots: ["10:00-11:00"],
    },
];

export default function MemberDashboard() {
    return <FacilityGrid facilities={mockFacilities} />;
}
