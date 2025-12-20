import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProductModal({ isOpen, onClose, onSuccess }: CreateProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    size: "",
    stock: ""
  });

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `product-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from('products')
        .insert([{
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          size: formData.size,
          stock: formData.stock === "" ? null : parseInt(formData.stock),
          image_url: imageUrl,
          is_active: true
        }]);

      if (error) throw error;

      toast.success("Product created successfully!");
      onSuccess();
      onClose();
      setFormData({ name: "", description: "", price: "", size: "", stock: "" });
      setImageFile(null);
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="size">Size</Label>
            <Input
              id="size"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              placeholder="e.g., 500ml, 1L"
              required
            />
          </div>

          <div>
            <Label htmlFor="stock">Stock Quantity</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              placeholder="Leave empty for unlimited stock"
            />
            <p className="text-sm text-muted-foreground mt-1">Leave empty for unlimited availability</p>
          </div>

          <div>
            <Label htmlFor="image">Product Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Product"}
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