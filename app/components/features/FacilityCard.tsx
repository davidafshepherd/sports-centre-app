import { Facility } from "@/app/types";
import styles from "./FacilityCard.module.css"

interface FacilityCardProps {
    facility: Facility;
}

export default function FacilityCard({ facility }: FacilityCardProps) {
    return (
        <div className={styles.card}>
            <h2>{facility.name}</h2>
            <p>{facility.description}</p>
            <p><strong>Opening Hours:</strong> {facility.openingHours}</p>
            <p><strong>Location:</strong> {facility.location}</p>
            {facility.isBookedByMember ? (
                <p style={{ color: 'green' }}>You have booked this facility.</p>
            ) : (
                <p style={{ color: 'red' }}>You have not booked this facility.</p>
            )}
            <p><strong>Booked Slots:</strong> {facility.bookedSlots.length > 0 ? facility.bookedSlots.join(', ') : 'None'}</p>
        </div>
        //TODO: will probably end up removing the bookedByMember and BookedSlots parts here with the styling (just want to see stuff showing for now in barebones form)
    )
}