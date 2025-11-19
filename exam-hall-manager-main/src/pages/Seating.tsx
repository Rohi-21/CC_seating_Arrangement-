// src/pages/Seating.tsx
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin, Download, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateSeatingAllocations, Student as SAStudent, Room as SARoom } from "@/lib/seatingAlgorithm";
import { generateRoomWisePDF, generateStudentWisePDF } from "@/lib/pdfGenerator";
import { format } from "date-fns";

interface Exam {
  id: number;
  course_code: string;
  course_name: string;
  exam_date: string;
  exam_time: string;
  department?: string;
  semester?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

/** API client (unchanged) */
const apiClient = {
  buildUrl(path: string) {
    return path.startsWith("http") ? path : `${API_BASE}${path}`;
  },
  async get(path: string) {
    const res = await fetch(this.buildUrl(path), {
      method: "GET",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `HTTP ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as any;
  },
  async post(path: string, body: any) {
    const res = await fetch(this.buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `HTTP ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as any;
  },
  async del(path: string) {
    const res = await fetch(this.buildUrl(path), { method: "DELETE" });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `HTTP ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as any;
  },
};

export default function Seating() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasAllocations, setHasAllocations] = useState(false);
  const { toast } = useToast();

  // Load exams
  const fetchExams = async () => {
    try {
      const data = await apiClient.get("/api/exams");
      setExams(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load exams", variant: "destructive" });
      setExams([]);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const checkExistingAllocations = async (examId: string) => {
    if (!examId) return false;
    try {
      const q = `?exam_id=${encodeURIComponent(examId)}&limit=1`;
      const data = await apiClient.get(`/api/seating_allocations${q}`);
      return Array.isArray(data) && data.length > 0;
    } catch {
      return false;
    }
  };

  // normalize server student -> algorithm Student (IDs must be numbers)
  const fetchStudents = async (): Promise<SAStudent[]> => {
    try {
      const data = await apiClient.get("/api/students");
      if (!Array.isArray(data)) return [];
      return data.map((s: any) => ({
        id: Number(s.id),
        roll_number: s.roll_number ?? "",
        name: s.name ?? "",
        department: s.department ?? "",
      }));
    } catch {
      return [];
    }
  };

  // normalize server room -> algorithm Room (IDs must be numbers)
  const fetchRooms = async (): Promise<SARoom[]> => {
    try {
      const data = await apiClient.get("/api/rooms");
      if (!Array.isArray(data)) return [];
      return data.map((r: any) => ({
        id: Number(r.id),
        room_number: r.room_number ?? "",
        capacity: Number(r.capacity) || 0,
        rows: r.rows === null || r.rows === undefined ? null : Number(r.rows),
        columns: r.columns === null || r.columns === undefined ? null : Number(r.columns),
      }));
    } catch {
      return [];
    }
  };

  // Generate seating logic (uses normalized students/rooms)
  const handleGenerateSeating = async () => {
    if (!selectedExamId) {
      toast({ title: "Error", description: "Please select an exam", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const exists = await checkExistingAllocations(selectedExamId);
      if (exists) {
        const confirmed = window.confirm("Seating allocations already exist for this exam. Regenerate?");
        if (!confirmed) {
          setLoading(false);
          return;
        }
        await apiClient.del(`/api/seating_allocations?exam_id=${encodeURIComponent(selectedExamId)}`);
      }

      const students = await fetchStudents();
      const rooms = await fetchRooms();

      if (!students.length) {
        toast({ title: "Error", description: "No students found. Add students first.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (!rooms.length) {
        toast({ title: "Error", description: "No rooms found. Add rooms first.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // now types match the algorithm
      const allocations = generateSeatingAllocations(students, rooms, true);

      if (!Array.isArray(allocations)) throw new Error("Invalid seating allocations from algorithm");

      if (allocations.length < students.length) {
        toast({
          title: "Warning",
          description: `Only ${allocations.length} of ${students.length} students allocated. Increase capacity or add rooms.`,
        });
      }

      // map algorithm fields to backend column names
      const payload = allocations.map((alloc: any) => ({
        exam_id: Number(selectedExamId),
        student_id: alloc.student_id,
        room_id: alloc.room_id,
        seat_number: alloc.seat_number,           // numeric
        seat_row: alloc.row_number ?? null,       // backend expects seat_row
        seat_col: alloc.column_number ?? null,    // backend expects seat_col
      }));

      await apiClient.post("/api/seating_allocations", { allocations: payload });

      toast({ title: "Success", description: `Allocated ${allocations.length} students.` });
      setHasAllocations(true);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to generate seating", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Room-wise PDF
  const handleDownloadRoomWise = async () => {
    if (!selectedExamId) return;
    try {
      const exam = await apiClient.get(`/api/exams/${encodeURIComponent(selectedExamId)}`);
      const allocations = await apiClient.get(
        `/api/seating_allocations?exam_id=${encodeURIComponent(selectedExamId)}&include=students,rooms`
      );

      if (!Array.isArray(allocations) || allocations.length === 0) {
        toast({ title: "Error", description: "No seating data available", variant: "destructive" });
        return;
      }

      const roomGroups = allocations.reduce((acc: any, alloc: any) => {
        const roomKey = alloc.rooms?.room_number || alloc.room_id || "Unknown";
        if (!acc[roomKey]) {
          acc[roomKey] = {
            room_number: alloc.rooms?.room_number || alloc.room_id,
            building: alloc.rooms?.building || "",
            students: [],
          };
        }
        acc[roomKey].students.push({
          roll_number: alloc.students?.roll_number || alloc.student_id,
          name: alloc.students?.name || "",
          department: alloc.students?.department || "",
          seat_number: alloc.seat_number,
        });
        return acc;
      }, {});

      const pdf = generateRoomWisePDF(Object.values(roomGroups), {
        course_name: exam.course_name,
        exam_date: format(new Date(exam.exam_date), "MMM dd, yyyy"),
        exam_time: exam.exam_time,
      });

      pdf.save(`room-wise-seating-${exam.course_code}.pdf`);
      toast({ title: "Success", description: "Room-wise PDF downloaded" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to generate PDF", variant: "destructive" });
    }
  };

  // Student-wise PDF
  const handleDownloadStudentWise = async () => {
    if (!selectedExamId) return;
    try {
      const exam = await apiClient.get(`/api/exams/${encodeURIComponent(selectedExamId)}`);
      const allocations = await apiClient.get(
        `/api/seating_allocations?exam_id=${encodeURIComponent(selectedExamId)}&include=students,rooms&order=students.roll_number`
      );

      if (!Array.isArray(allocations) || allocations.length === 0) {
        toast({ title: "Error", description: "No seating data available", variant: "destructive" });
        return;
      }

      const studentAllocations = allocations.map((alloc: any) => ({
        roll_number: alloc.students?.roll_number || alloc.student_id,
        name: alloc.students?.name || "",
        department: alloc.students?.department || "",
        room_number: alloc.rooms?.room_number || alloc.room_id,
        seat_number: alloc.seat_number,
      }));

      const pdf = generateStudentWisePDF(studentAllocations, {
        course_name: exam.course_name,
        exam_date: format(new Date(exam.exam_date), "MMM dd, yyyy"),
        exam_time: exam.exam_time,
      });

      pdf.save(`student-wise-seating-${exam.course_code}.pdf`);
      toast({ title: "Success", description: "Student-wise PDF downloaded" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to generate PDF", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!selectedExamId) {
      setHasAllocations(false);
      return;
    }
    checkExistingAllocations(selectedExamId).then(setHasAllocations);
  }, [selectedExamId]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Seating Allocation</h1>
          <p className="text-muted-foreground mt-2">Generate and manage exam hall seating arrangements</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Seating</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <Label>Select Exam</Label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an exam" />
                </SelectTrigger>

                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={String(exam.id)}>
                      {exam.course_code} - {exam.course_name} ({format(new Date(exam.exam_date), "MMM dd")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleGenerateSeating} disabled={!selectedExamId || loading} size="lg" className="w-full">
                <MapPin className="h-4 w-4 mr-2" />
                {loading ? "Generating..." : "Generate Seating"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Room-wise Reports</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Download seating charts for each exam hall with student assignments.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadRoomWise} disabled={!hasAllocations || !selectedExamId}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={handleDownloadRoomWise} disabled={!hasAllocations || !selectedExamId}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student-wise Reports</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Download individual seat allocation list sorted by student roll numbers.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadStudentWise} disabled={!hasAllocations || !selectedExamId}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={handleDownloadStudentWise} disabled={!hasAllocations || !selectedExamId}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print List
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
