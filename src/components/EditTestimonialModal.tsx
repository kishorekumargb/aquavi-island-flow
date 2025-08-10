import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Testimonial {
  id: string;
  name: string;
  location: string;
  review: string;
  rating: number;
  avatar: string | null;
  is_active: boolean;
  role?: string;
  content?: string;
  avatar_url?: string | null;
}

interface EditTestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  testimonial: Testimonial | null;
}

export function EditTestimonialModal({ isOpen, onClose, onSuccess, testimonial }: EditTestimonialModalProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    content: "",
    rating: "5",
    is_active: true
  });

  useEffect(() => {
    if (testimonial) {
      setFormData({
        name: testimonial.name,
        role: testimonial.location,
        content: testimonial.review,
        rating: testimonial.rating.toString(),
        is_active: testimonial.is_active
      });
    }
  }, [testimonial]);

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `testimonial-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('testimonials')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('testimonials')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonial) return;
    
    setLoading(true);

    try {
      let avatarUrl = testimonial.avatar;
      if (imageFile) {
        avatarUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from('testimonials')
        .update({
          name: formData.name,
          location: formData.role,
          review: formData.content,
          rating: parseInt(formData.rating),
          avatar: avatarUrl,
          is_active: formData.is_active
        })
        .eq('id', testimonial.id);

      if (error) throw error;

      toast.success("Testimonial updated successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating testimonial:', error);
      toast.error("Failed to update testimonial");
    } finally {
      setLoading(false);
    }
  };

  if (!testimonial) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Testimonial</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Customer Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="role">Role/Position</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="content">Testimonial Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="rating">Rating (1-5 stars)</Label>
            <Input
              id="rating"
              type="number"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="active">Status</Label>
            <Select value={formData.is_active.toString()} onValueChange={(value) => setFormData({ ...formData, is_active: value === 'true' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="image">Update Customer Photo</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            {testimonial.avatar && (
              <p className="text-sm text-muted-foreground mt-1">Current photo will be kept if no new image is uploaded</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Updating..." : "Update Testimonial"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}