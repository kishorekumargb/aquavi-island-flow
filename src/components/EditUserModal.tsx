import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (userData: any) => Promise<void>;
  user: any;
  isUpdating: boolean;
}

export function EditUserModal({
  isOpen,
  onClose,
  onUpdateUser,
  user,
  isUpdating,
}: EditUserModalProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setDisplayName(user.display_name || '');
      // Take the first role or default to 'user'
      const role = user.roles?.[0] || 'user';
      setSelectedRole(role);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !displayName) {
      return;
    }

    await onUpdateUser({
      ...user,
      email,
      display_name: displayName,
      roles: [selectedRole],
    });
  };

  const availableRoles = ['user', 'admin'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full Name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Role</Label>
            <RadioGroup value={selectedRole} onValueChange={setSelectedRole}>
              {availableRoles.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <RadioGroupItem value={role} id={role} />
                  <Label htmlFor={role} className="capitalize cursor-pointer">
                    {role}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}