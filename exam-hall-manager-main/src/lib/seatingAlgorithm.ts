// src/lib/seatingAlgorithm.ts
export interface Student {
  id: number;
  roll_number?: string;
  name?: string;
  department?: string;
}

export interface Room {
  id: number;
  room_number?: string;
  capacity: number;
  rows: number | null;
  columns: number | null;
}

export interface SeatingAllocation {
  student_id: number;
  room_id: number;
  seat_number: number;           // numeric seat index
  row_number: number | null;
  column_number: number | null;
}

/**
 * Generate seating allocations.
 * - Students and rooms arrays are consumed; students may be interleaved by department.
 * - Returns an array of SeatingAllocation objects (student_id, room_id, seat_number, row/col).
 */
export function generateSeatingAllocations(
  students: Student[],
  rooms: Room[],
  mixDepartments: boolean = true
): SeatingAllocation[] {
  const allocations: SeatingAllocation[] = [];

  // sort rooms by capacity (largest first)
  const sortedRooms = [...rooms].sort((a, b) => (b.capacity || 0) - (a.capacity || 0));

  // copy student list and optionally mix/interleave by department
  let studentsList: Student[] = [...students];

  if (mixDepartments) {
    const deptGroups = students.reduce((acc: Record<string, Student[]>, s) => {
      const k = s.department || "__none";
      if (!acc[k]) acc[k] = [];
      acc[k].push(s);
      return acc;
    }, {});

    const deptKeys = Object.keys(deptGroups);
    const maxLen = Math.max(...Object.values(deptGroups).map(g => g.length));

    studentsList = [];
    for (let i = 0; i < maxLen; i++) {
      for (const d of deptKeys) {
        const candidate = deptGroups[d][i];
        if (candidate) studentsList.push(candidate);
      }
    }
  } else {
    // simple shuffle
    studentsList.sort(() => Math.random() - 0.5);
  }

  let studentIndex = 0;

  for (const room of sortedRooms) {
    if (studentIndex >= studentsList.length) break;
    const capacity = Number(room.capacity) || 0;
    const rows = Number(room.rows) || 0;
    const cols = Number(room.columns) || 0;
    const useLayout = Boolean(rows && cols);

    for (let seat = 1; seat <= capacity && studentIndex < studentsList.length; seat++) {
      const student = studentsList[studentIndex];

      let row_number: number | null = null;
      let column_number: number | null = null;
      const seat_number = seat; // numeric

      if (useLayout && cols > 0) {
        const seatIndex = seat - 1;
        row_number = Math.floor(seatIndex / cols) + 1;
        column_number = (seatIndex % cols) + 1;
      }

      allocations.push({
        student_id: student.id,
        room_id: room.id,
        seat_number,
        row_number,
        column_number,
      });

      studentIndex++;
    }

    if (studentIndex >= studentsList.length) break;
  }

  return allocations;
}
