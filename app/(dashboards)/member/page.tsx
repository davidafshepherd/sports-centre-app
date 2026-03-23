import FacilityGrid from "@/app/components/features/FacilityGrid"
import { Facility } from "@/app/types"

// TODO: these are just here for testing and seeing examples: replace with real ones created by an admin later
const mockFacilities: Facility[] = [
  { id: "1", name: "Badminton Court", description: "...", openingHours: "9am - 9pm", location: "Building A", isBookedByMember: false, bookedSlots: [] },
  { id: "2", name: "Football Pitch", description: "...", openingHours: "10am - 8pm", location: "Building B", isBookedByMember: true, bookedSlots: ["10:00-11:00"] },
]

export default function MemberDashboard() {
  return <FacilityGrid facilities={mockFacilities} />
}