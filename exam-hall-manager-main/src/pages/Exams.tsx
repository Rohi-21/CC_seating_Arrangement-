import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AddExamDialog } from "@/components/exams/AddExamDialog";
import { getExams } from "@/lib/api";

interface Exam {
  id: number;
  course_code: string;
  course_name: string;
  exam_date: string;
  exam_time: string;
  department: string;
  semester: number;
  duration_minutes: number;
}

export default function Exams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await getExams();
      setExams(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load exams",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Exams & Timetable</h1>
            <p className="text-muted-foreground mt-2">
              Schedule and manage examination sessions
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Exam
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Scheduled Exams</h2>
              <Badge variant="secondary">{exams.length} Total</Badge>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading exams...</div>
            ) : exams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No exams scheduled yet. Click “Add Exam” to get started.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {exams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.course_code}</TableCell>
                        <TableCell>{exam.course_name}</TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(exam.exam_date), "MMM dd, yyyy")}
                          </div>
                        </TableCell>

                        <TableCell>{exam.exam_time}</TableCell>

                        <TableCell>
                          <Badge variant="outline">{exam.department}</Badge>
                        </TableCell>

                        <TableCell>{exam.semester}</TableCell>

                        <TableCell>{exam.duration_minutes} min</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddExamDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchExams}
      />
    </DashboardLayout>
  );
}
