import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/utils/toast-replacement";
import { useNavigate } from "react-router-dom";

interface CreateCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCommunity: (name: string, description: string, tags: string[]) => Promise<string | null>;
  children?: React.ReactNode;
}

const CreateCommunityDialog: React.FC<CreateCommunityDialogProps> = ({
  open,
  onOpenChange,
  onCreateCommunity,
  children
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const navigate = useNavigate();
  
  const resetForm = () => {
    setName("");
    setDescription("");
    setTags([]);
    setTagInput("");
    setIsSubmitting(false);
    setNameError("");
  };
  
  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onOpenChange(false);
    }
  };
  
  const validateName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Community name is required");
      return false;
    }
    if (trimmedName.length < 2) {
      setNameError("Community name must be at least 2 characters");
      return false;
    }
    if (trimmedName.length > 50) {
      setNameError("Community name must be less than 50 characters");
      return false;
    }
    
    setNameError("");
    return true;
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (newName.trim()) {
      validateName(newName);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateName(name)) {
      toast.error("Please provide a valid community name");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const communityId = await onCreateCommunity(name.trim(), description.trim(), tags);
      if (communityId) {
        toast.success("Community created successfully!", {
          description: "Welcome to your new community!"
        });
        
        handleClose();
        
        // Navigate to the newly created community immediately
        setTimeout(() => {
          navigate(`/dao/${communityId}`);
        }, 100);
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Failed to create community", {
        description: "Please try again or check your connection"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag]);
      }
      
      setTagInput("");
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const suggestedTags = ["blockchain", "crypto", "dao", "defi", "nft", "web3", "gaming", "art", "music", "tech"];
  const availableSuggestedTags = suggestedTags.filter(tag => !tags.includes(tag));
  
  return (
    <>
      {children && (
        <div onClick={() => onOpenChange(true)}>
          {children}
        </div>
      )}
      
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Create a New Community
            </DialogTitle>
            <DialogDescription>
              Start a decentralized community on Nostr to connect with like-minded people
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Community Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Community Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter community name"
                required
                maxLength={50}
                className={nameError ? "border-red-500 focus-visible:ring-red-500" : ""}
                disabled={isSubmitting}
              />
              {nameError && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {nameError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Choose a descriptive name for your community
              </p>
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your community's purpose, goals, and what members can expect..."
                rows={4}
                maxLength={500}
                disabled={isSubmitting}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>
            
            {/* Tags */}
            <div className="space-y-3">
              <Label htmlFor="tags" className="text-sm font-medium">
                Tags {tags.length > 0 && <span className="text-muted-foreground">({tags.length}/5)</span>}
              </Label>
              
              {/* Current Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="px-3 py-1">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                        disabled={isSubmitting}
                        aria-label={`Remove ${tag} tag`}
                        title={`Remove ${tag} tag`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Tag Input */}
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder={tags.length < 5 ? "Add tags (press Enter)" : "Maximum 5 tags reached"}
                onKeyDown={addTag}
                disabled={isSubmitting || tags.length >= 5}
                maxLength={20}
              />
              
              {/* Suggested Tags */}
              {availableSuggestedTags.length > 0 && tags.length < 5 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Suggested tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {availableSuggestedTags.slice(0, 6).map(tag => (
                      <Button
                        key={tag} 
                        type="button"
                        variant="outline" 
                        size="sm"
                        className="h-6 text-xs px-2 hover:bg-secondary"
                        onClick={() => {
                          if (!isSubmitting && tags.length < 5) {
                            setTags([...tags, tag]);
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Tags help others discover your community
              </p>
            </div>
          </form>
          
          <DialogFooter className="pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || isSubmitting}
              onClick={handleSubmit}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Create Community
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateCommunityDialog; 