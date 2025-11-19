import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addExam } from "@/lib/api";

interface AddExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddExamDialog({ open, onOpenChange, onSuccess }: AddExamDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    exam_date: "",
    exam_time: "",
    department: "",
    semester: "",
    duration_minutes: "180",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        course_code: formData.course_code.trim(),
        course_name: formData.course_name.trim(),
        exam_date: formData.exam_date,
        exam_time: formData.exam_time,
        department: formData.department.trim(),
        semester: parseInt(String(formData.semester), 10),
        duration_minutes: parseInt(String(formData.duration_minutes), 10),
      };

      // basic validation
      if (!payload.course_code || !payload.course_name || !payload.exam_date || !payload.exam_time || !payload.department || isNaN(payload.semester) || isNaN(payload.duration_minutes)) {
        toast({
          title: "Validation error",
          description: "Please fill all required fields with valid values.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const result = await addExam(payload);
      // addExam throws on non-OK; if it returns, assume success
      toast({
        title: "Success",
        description: "Exam added successfully",
      });

      setFormData({
        course_code: "",
        course_name: "",
        exam_date: "",
        exam_time: "",
        department: "",
        semester: "",
        duration_minutes: "180",
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      const message = err?.message || (typeof err === "string" ? err : "Failed to add exam");
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Exam</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="course_code">Course Code *</Label>
              <Input
                id="course_code"
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course_name">Course Name *</Label>
              <Input
                id="course_name"
                value={formData.course_name}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exam_date">Exam Date *</Label>
              <Input
                id="exam_date"
                type="date"
                value={formData.exam_date}
                onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exam_time">Exam Time *</Label>
              <Input
                id="exam_time"
                type="time"
                value={formData.exam_time}
                onChange={(e) => setFormData({ ...formData, exam_time: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="semester">Semester *</Label>
              <Input
                id="semester"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
              <Input
                id="duration_minutes"
                type="number"
                min={30}
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Exam"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
