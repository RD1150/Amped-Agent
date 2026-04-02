import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Check } from "lucide-react";

type ImageLibraryPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (imageUrls: string[]) => void;
  multiSelect?: boolean;
  title?: string;
};

export default function ImageLibraryPicker({
  open,
  onClose,
  onSelect,
  multiSelect = false,
  title = "Select Image from Library",
}: ImageLibraryPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | undefined>(undefined);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  const { data: images = [], isLoading } = trpc.imageLibrary.list.useQuery(
    { tag: tagFilter },
    { enabled: open }
  );

  const toggleSelection = (url: string) => {
    if (multiSelect) {
      setSelectedUrls((prev) =>
        prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
      );
    } else {
      setSelectedUrls([url]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedUrls);
    setSelectedUrls([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedUrls([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-[#0a0a1a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <Input
            placeholder="Filter by tag..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setTagFilter(e.target.value || undefined);
            }}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-white/40" size={32} />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/40">
              <p>No images found</p>
              <p className="text-sm mt-1">Upload images to your library first</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 p-2">
              {images.map((img) => {
                const isSelected = selectedUrls.includes(img.url);
                return (
                  <div
                    key={img.id}
                    onClick={() => toggleSelection(img.url)}
                    className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      isSelected
                        ? "border-amber-400 ring-2 ring-amber-400/50"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.hookText || img.filename || "Library image"}
                      className="w-full h-48 object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-amber-400 rounded-full p-1">
                        <Check size={16} className="text-black" />
                      </div>
                    )}
                    {img.tags && img.tags.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <div className="flex flex-wrap gap-1">
                          {img.tags.slice(0, 3).map((tag, i) => (
                            <Badge
                              key={i}
                              className="bg-white/20 text-white text-xs border-0"
                            >
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <p className="text-sm text-white/40">
            {selectedUrls.length > 0
              ? `${selectedUrls.length} image${selectedUrls.length > 1 ? "s" : ""} selected`
              : multiSelect
              ? "Select one or more images"
              : "Select an image"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} className="bg-transparent border-white/20 text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className="bg-amber-400 text-black hover:bg-amber-500"
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
