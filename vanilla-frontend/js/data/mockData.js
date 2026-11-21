
/**
 * Fictional demonstration data.
 * These records are NOT real beneficiary information.
 */

const MOCK_DATA = {
  
schedules: [
  {
    id: 1,
    barangay: "Barangay Maligaya",
    date: "May 15, 2025",
    day: "Thursday",
    time: "8:00 AM – 12:00 PM",
    venue: "Maligaya Covered Court",
    group: "Surnames A–L"
  },
  {
    id: 2,
    barangay: "Barangay Pag-asa",
    date: "May 16, 2025",
    day: "Friday",
    time: "1:00 PM – 5:00 PM",
    venue: "Pag-asa Multipurpose Hall",
    group: "All listed beneficiaries"
  },
  {
    id: 3,
    barangay: "Barangay San Isidro",
    date: "May 19, 2025",
    day: "Monday",
    time: "8:00 AM – 3:00 PM",
    venue: "San Isidro Civic Center",
    group: "Surnames M–Z"
  },
  {
    id: 4,
    barangay: "Barangay Mabini",
    date: "May 21, 2025",
    day: "Wednesday",
    time: "9:00 AM – 2:00 PM",
    venue: "Mabini Elementary School Gym",
    group: "All listed beneficiaries"
  }
],

  beneficiaries: [
    {
      referenceCode: "HBD-2025-0142",
      name: "Maria Santos",
      barangay: "Maligaya",
      scheduleId: 1
    }
  ],

  
announcements: [
  {
    id: 1,
    type: "Schedule update",
    date: "May 8, 2025",
    title: "Barangay Mabini venue confirmed",
    text: "The sample distribution venue is the Mabini Elementary School Gym. Please use the east gate entrance."
  },
  {
    id: 2,
    type: "Reminder",
    date: "May 6, 2025",
    title: "Bring original documents",
    text: "Prepare your original valid ID and reference slip. Photocopies may be requested at the validation desk."
  },
  {
    id: 3,
    type: "Advisory",
    date: "May 2, 2025",
    title: "No fee is required",
    text: "This fictional program does not collect processing fees. Report anyone asking for payment to the help desk."
  }
]

};
