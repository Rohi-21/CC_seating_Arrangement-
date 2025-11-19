import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addRoom } from "@/lib/api";

interface AddRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddRoomDialog({ open, onOpenChange, onSuccess }: AddRoomDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    room_number: "",
    building: "",
    floor: "",
    capacity: "",
    rows: "",
    columns: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        room_number: formData.room_number.trim(),
        building: formData.building?.trim() || null,
        floor: formData.floor ? parseInt(String(formData.floor), 10) : null,
        capacity: parseInt(String(formData.capacity), 10),
        rows: formData.rows ? parseInt(String(formData.rows), 10) : null,
        columns: formData.columns ? parseInt(String(formData.columns), 10) : null,
      };

      // validation
      if (!payload.room_number || isNaN(payload.capacity) || payload.capacity < 1) {
        toast({
          title: "Validation error",
          description: "Provide a valid room number and capacity.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const result = await addRoom(payload);
      // if addRoom throws on error, we reach here on success
      toast({
        title: "Success",
        description: "Room added successfully",
      });

      setFormData({
        room_number: "",
        building: "",
        floor: "",
        capacity: "",
        rows: "",
        columns: "",
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      const message = err?.message || (typeof err === "string" ? err : "Failed to add room");
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
          <DialogTitle>Add Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="room_number">Room Number *</Label>
              <Input
                id="room_number"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="building">Building</Label>
              <Input
                id="building"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                type="number"
                min={0}
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rows">Rows</Label>
                <Input
                  id="rows"
                  type="number"
                  min={1}
                  value={formData.rows}
                  onChange={(e) => setFormData({ ...formData, rows: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="columns">Columns</Label>
                <Input
                  id="columns"
                  type="number"
                  min={1}
                  value={formData.columns}
                  onChange={(e) => setFormData({ ...formData, columns: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
