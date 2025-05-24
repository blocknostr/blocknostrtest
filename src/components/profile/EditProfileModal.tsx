import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ProfileMetadata } from "@/lib/adapters/ProfileAdapter";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileMetadata | null;
}

const FIELDS = [
  { key: "name", label: "Username" },
  { key: "display_name", label: "Display Name" },
  { key: "about", label: "About", textarea: true },
  { key: "picture", label: "Avatar URL" },
  { key: "banner", label: "Banner URL" },
  { key: "website", label: "Website" },
  { key: "nip05", label: "NIP-05 Verification" },
  { key: "lud16", label: "Lightning Address" },
];

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onOpenChange, profile }) => {
  const [form, setForm] = useState<ProfileMetadata>({});

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile, open]);

  const handleChange = (key: keyof ProfileMetadata, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCancel = () => {
    setForm(profile || {});
    onOpenChange(false);
  };

  // Placeholder for save logic
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save logic (publish kind 0 event)
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-5 py-2">
          {FIELDS.map((field) => (
            <div key={field.key} className="space-y-1">
              <label className="block text-sm font-medium text-foreground" htmlFor={field.key}>
                {field.label}
              </label>
              {field.textarea ? (
                <Textarea
                  id={field.key}
                  value={form[field.key as keyof ProfileMetadata] || ""}
                  onChange={(e) => handleChange(field.key as keyof ProfileMetadata, e.target.value)}
                  className="w-full"
                  rows={3}
                />
              ) : (
                <Input
                  id={field.key}
                  value={form[field.key as keyof ProfileMetadata] || ""}
                  onChange={(e) => handleChange(field.key as keyof ProfileMetadata, e.target.value)}
                  className="w-full"
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
