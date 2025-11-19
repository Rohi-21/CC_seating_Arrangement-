import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RoomAllocation {
  room_number: string;
  building: string | null;
  students: {
    roll_number: string;
    name: string;
    seat_number: string;
    department: string;
  }[];
}

interface StudentAllocation {
  roll_number: string;
  name: string;
  department: string;
  room_number: string;
  seat_number: string;
}

export function generateRoomWisePDF(
  allocations: RoomAllocation[],
  examDetails: { course_name: string; exam_date: string; exam_time: string }
) {
  const doc = new jsPDF();
  
  allocations.forEach((room, index) => {
    if (index > 0) {
      doc.addPage();
    }
    
    // Header
    doc.setFontSize(18);
    doc.text("Exam Hall Seating Arrangement", 105, 15, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Room: ${room.room_number}${room.building ? ` (${room.building})` : ""}`, 20, 30);
    doc.text(`Course: ${examDetails.course_name}`, 20, 38);
    doc.text(`Date: ${examDetails.exam_date} | Time: ${examDetails.exam_time}`, 20, 46);
    
    // Table
    autoTable(doc, {
      startY: 55,
      head: [["Seat No.", "Roll Number", "Name", "Department"]],
      body: room.students.map(s => [
        s.seat_number,
        s.roll_number,
        s.name,
        s.department,
      ]),
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20, right: 20 },
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(10);
    doc.text(
      `Page ${index + 1} of ${allocations.length}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  });
  
  return doc;
}

export function generateStudentWisePDF(
  allocations: StudentAllocation[],
  examDetails: { course_name: string; exam_date: string; exam_time: string }
) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text("Student Seating List", 105, 15, { align: "center" });
  
  doc.setFontSize(12);
  doc.text(`Course: ${examDetails.course_name}`, 20, 30);
  doc.text(`Date: ${examDetails.exam_date} | Time: ${examDetails.exam_time}`, 20, 38);
  
  // Table
  autoTable(doc, {
    startY: 50,
    head: [["Roll Number", "Name", "Department", "Room", "Seat No."]],
    body: allocations.map(s => [
      s.roll_number,
      s.name,
      s.department,
      s.room_number,
      s.seat_number,
    ]),
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: 20, right: 20 },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }
  
  return doc;
}
