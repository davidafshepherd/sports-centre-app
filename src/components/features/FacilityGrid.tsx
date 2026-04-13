import { Facility } from "@/types"
import FacilityCard from "./FacilityCard"
import styles from "./FacilityGrid.module.css"

interface FacilityGridProps {
  facilities: Facility[]
}

export default function FacilityGrid({ facilities }: FacilityGridProps) {
  return (
    <div className={styles.grid}>
      {facilities.map(facility => (
        <FacilityCard key={facility.id} facility={facility} />
      ))}
    </div>
  )
}