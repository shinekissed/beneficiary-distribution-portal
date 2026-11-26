
/**
 * Fictional demonstration data.
 * These records are NOT real beneficiary information.
 */

const MOCK_DATA = {
  
schedules: [
  {
    id: 1,
    barangay: "Barangay Maligaya",
    date: "November 15, 2026",
    day: "Sunday",
    time: "8:00 AM – 12:00 PM",
    venue: "Maligaya Covered Court",
    group: "Surnames A–L"
  },
  {
    id: 2,
    barangay: "Barangay Pag-asa",
    date: "November 16, 2026",
    day: "Monday",
    time: "1:00 PM – 5:00 PM",
    venue: "Pag-asa Multipurpose Hall",
    group: "All listed beneficiaries"
  },
  {
    id: 3,
    barangay: "Barangay San Isidro",
    date: "November 19, 2026",
    day: "Thursday",
    time: "8:00 AM – 3:00 PM",
    venue: "San Isidro Civic Center",
    group: "Surnames M–Z"
  },
  {
    id: 4,
    barangay: "Barangay Mabini",
    date: "November 21, 2026",
    day: "Saturday",
    time: "9:00 AM – 2:00 PM",
    venue: "Mabini Elementary School Gym",
    group: "All listed beneficiaries"
  }
],

  beneficiaries: [
    {
      referenceCode: "HBD-2026-0142",
      name: "Maria Santos",
      barangay: "Maligaya",
      scheduleId: 1
    }
  ],

  
announcements: [
  {
    id: 1,
    type: "Schedule update",
    date: "November 8, 2026",
    title: "Barangay Mabini venue confirmed",
    text: "The sample distribution venue is the Mabini Elementary School Gym. Please use the east gate entrance."
  },
  {
    id: 2,
    type: "Reminder",
    date: "November 6, 2026",
    title: "Bring original documents",
    text: "Prepare your original valid ID and reference slip. Photocopies may be requested at the validation desk."
  },
  {
    id: 3,
    type: "Advisory",
    date: "November 2, 2026",
    title: "No fee is required",
    text: "This fictional program does not collect processing fees. Report anyone asking for payment to the help desk."
  }
]

};
