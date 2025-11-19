import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { Upload, Download } from "lucide-react";
import { addStudent } from "@/lib/api";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CSVImportDialog({ open, onOpenChange, onSuccess }: CSVImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      preview: 5,
      complete: (results) => setPreview(results.data),
    });
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawRows: any[] = results.data;

        const parsedStudents = rawRows.map((row) => ({
          roll_number: row.roll_number || row.Roll_Number || row.RollNumber,
          name: row.name || row.Name,
          department: row.department || row.Department,
          semester: parseInt(row.semester || row.Semester, 10),
          section: row.section || row.Section || null,
          email: row.email || row.Email || null,
        }));

        let successCount = 0;
        let failedCount = 0;

        for (const s of parsedStudents) {
          try {
            await addStudent(s); // call backend
            successCount++;
          } catch {
            failedCount++;
          }
        }

        toast({
          title: "Import Complete",
          description: `${successCount} students imported. ${failedCount} failed.`,
        });

        setFile(null);
        setPreview([]);
        onSuccess();
        onOpenChange(false);
        setLoading(false);
      },
      error: () => {
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
        setLoading(false);
      },
    });
  };

  const downloadTemplate = () => {
    const template = `roll_number,name,department,semester,section,email
21CS001,John Doe,Computer Science,5,A,john@example.com
21CS002,Jane Smith,Computer Science,5,A,jane@example.com`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_template.csv";
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Students from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription>
              Upload a CSV with: roll_number, name, department, semester, section (optional), email (optional)
            </AlertDescription>
          </Alert>

          <Button type="button" variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>

          <div className="grid gap-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
          </div>

          {preview.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Preview (first 5 rows)</h3>
              <div className="text-sm space-y-1">
                {preview.map((row: any, idx) => (
                  <div key={idx} className="text-muted-foreground">
                    {(row.roll_number || row.Roll_Number) ?? "??"} — {(row.name || row.Name) ?? "??"}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={handleImport} disabled={!file || loading}>
            <Upload className="h-4 w-4 mr-2" />
            {loading ? "Importing..." : "Import Students"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
