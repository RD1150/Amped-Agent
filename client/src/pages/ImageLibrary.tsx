import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Upload, Images, Sparkles, Trash2, Tag, Search, Filter, X, Loader2, ImageIcon, Plus,
  CheckSquare, Video, Square,
} from "lucide-react";

type LibraryImage = {
  id: number;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number | null;
  hookText: string | null;
  hookGenerated: number;
  tags: string[];
  propertyAddress: string | null;
  roomType: string | null;
  createdAt: Date;
};

const ROOM_TYPES = [
  "Living Room", "Kitchen", "Master Bedroom", "Bedroom", "Bathroom",
  "Dining Room", "Office", "Garage", "Backyard", "Front Exterior",
  "Pool", "Laundry Room", "Basement", "Attic", "Other",
];

function HookOverlay({ hookText }: { hookText: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-3">
      <div
        className="inline-block px-3 py-1.5 rounded-sm"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(2px)",
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "#fff",
          letterSpacing: "0.01em",
          lineHeight: 1.4,
          maxWidth: "100%",
        }}
      >
        {hookText}
      </div>
    </div>
  );
}

function UploadZone({ onFilesSelected, uploading }: { onFilesSelected: (files: File[]) => void; uploading: boolean }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFilesSelected(files);
  }, [onFilesSelected]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
        uploading ? "opacity-60 cursor-not-allowed" :
        dragging ? "border-amber-400 bg-amber-400/10 cursor-copy" :
        "border-white/20 hover:border-amber-400/50 hover:bg-white/5 cursor-pointer"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
          if (files.length) onFilesSelected(files);
          e.target.value = "";
        }}
      />
      {uploading ? (
        <Loader2 className="mx-auto mb-3 text-amber-400 animate-spin" size={36} />
      ) : (
        <Upload className="mx-auto mb-3 text-amber-400/70" size={36} />
      )}
      <p className="text-white font-semibold mb-1">
        {uploading ? "Uploading photos..." : "Drop photos here or click to browse"}
      </p>
      <p className="text-white/50 text-sm">JPG, PNG, WEBP — multiple files supported</p>
    </div>
  );
}

function ImageCard({
  image, onDelete, onGenerateHook, onSelect, isGeneratingHook, isSelected, onToggleSelect,
}: {
  image: LibraryImage;
  onDelete: (id: number) => void;
  onGenerateHook: (id: number, url: string, roomType?: string | null) => void;
  onSelect: (image: LibraryImage) => void;
  isGeneratingHook: boolean;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
}) {
  return (
    <div className={`group relative rounded-xl overflow-hidden bg-white/5 border transition-all ${
      isSelected ? "border-amber-400 ring-2 ring-amber-400/40" : "border-white/10 hover:border-amber-400/40"
    }`}>
      {/* Select toggle — always visible when selected, hover-visible otherwise */}
      <button
        className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
          isSelected
            ? "bg-amber-400 border-amber-400 opacity-100"
            : "bg-black/50 border-white/50 opacity-0 group-hover:opacity-100"
        }`}
        onClick={(e) => { e.stopPropagation(); onToggleSelect(image.id); }}
        title={isSelected ? "Deselect" : "Select for batch action"}
      >
        {isSelected ? <X size={12} className="text-black" /> : <Square size={10} className="text-white" />}
      </button>

      <div className="relative aspect-[4/3] cursor-pointer overflow-hidden" onClick={() => onSelect(image)}>
        <img src={image.url} alt={image.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {image.hookText && <HookOverlay hookText={image.hookText} />}
        {image.roomType && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-black/60 text-white border-0 text-xs">{image.roomType}</Badge>
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <p className="text-white/80 text-xs truncate">{image.filename}</p>
        {image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {image.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs border-white/20 text-white/60 py-0">{tag}</Badge>
            ))}
            {image.tags.length > 3 && (
              <Badge variant="outline" className="text-xs border-white/20 text-white/60 py-0">+{image.tags.length - 3}</Badge>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs border-white/20 text-white/70 hover:text-amber-400 hover:border-amber-400/50 bg-transparent"
            onClick={() => onGenerateHook(image.id, image.url, image.roomType)}
            disabled={isGeneratingHook}
          >
            {isGeneratingHook ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
            {image.hookText ? "Regen Hook" : "AI Hook"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-white/20 text-red-400/70 hover:text-red-400 hover:border-red-400/50 bg-transparent px-2"
            onClick={() => onDelete(image.id)}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ImageLibraryPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [selectedImage, setSelectedImage] = useState<LibraryImage | null>(null);
  const [generatingHookFor, setGeneratingHookFor] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const utils = trpc.useUtils();
  const { data: images = [], isLoading } = trpc.imageLibrary.list.useQuery({});

  const uploadMutation = trpc.imageLibrary.upload.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.uploaded.length} photo${data.uploaded.length !== 1 ? "s" : ""} uploaded`);
      utils.imageLibrary.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateHookMutation = trpc.imageLibrary.generateHook.useMutation({
    onSuccess: () => {
      toast.success("AI hook generated!");
      utils.imageLibrary.list.invalidate();
      setGeneratingHookFor(null);
      if (selectedImage) {
        utils.imageLibrary.list.fetch({}).then((imgs) => {
          const updated = imgs.find((i) => i.id === selectedImage.id);
          if (updated) setSelectedImage(updated);
        });
      }
    },
    onError: (err) => { toast.error(err.message); setGeneratingHookFor(null); },
  });

  const deleteMutation = trpc.imageLibrary.delete.useMutation({
    onSuccess: () => { toast.success("Photo deleted"); utils.imageLibrary.list.invalidate(); setSelectedImage(null); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.imageLibrary.update.useMutation({
    onSuccess: () => utils.imageLibrary.list.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setUploading(true);
    try {
      const imageInputs = await Promise.all(files.map(async (file) => {
        const dataBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        return { filename: file.name, mimeType: file.type || "image/jpeg", dataBase64, sizeBytes: file.size };
      }));
      await uploadMutation.mutateAsync({ images: imageInputs });
    } catch { /* handled in mutation */ } finally { setUploading(false); }
  }, [uploadMutation]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      clearSelection();
    } else {
      setSelectedIds(new Set(filtered.map(img => img.id)));
    }
  };

  const handleUseInPropertyTour = () => {
    const selectedUrls = images
      .filter(img => selectedIds.has(img.id))
      .map(img => img.url);
    if (selectedUrls.length === 0) return;
    const encoded = encodeURIComponent(JSON.stringify(selectedUrls));
    navigate(`/property-tours?libraryImages=${encoded}`);
    toast.success(`Sending ${selectedUrls.length} photos to Property Tour`);
  };

  const handleUseInCinematicTour = () => {
    const selectedUrls = images
      .filter(img => selectedIds.has(img.id))
      .map(img => img.url);
    if (selectedUrls.length === 0) return;
    const encoded = encodeURIComponent(JSON.stringify(selectedUrls));
    navigate(`/cinematic-walkthrough?libraryImages=${encoded}`);
    toast.success(`Sending ${selectedUrls.length} photos to AI Motion Tour`);
  };

  const filtered = images.filter((img) => {
    const matchesSearch = !searchQuery ||
      img.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (img.propertyAddress || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRoom = filterRoom === "all" || img.roomType === filterRoom;
    return matchesSearch && matchesRoom;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Images className="text-amber-400" size={24} />
            Photo Library
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Upload and manage your property photos. Generate AI hook text for social posts.
          </p>
        </div>
        <Badge className="bg-amber-400/10 text-amber-400 border-amber-400/20">
          {images.length} photo{images.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Upload Zone */}
      <UploadZone onFilesSelected={handleFilesSelected} uploading={uploading} />

      {/* Filters + Select All */}
      {images.length > 0 && (
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search by filename, address, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-white/30"
            />
          </div>
          <Select value={filterRoom} onValueChange={setFilterRoom}>
            <SelectTrigger className="w-48 bg-white/5 border-white/20 text-white">
              <Filter size={14} className="mr-2 text-white/40" />
              <SelectValue placeholder="All rooms" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/20 text-white">
              <SelectItem value="all">All rooms</SelectItem>
              {ROOM_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white/60 bg-transparent gap-1.5"
            onClick={handleSelectAll}
          >
            <CheckSquare size={14} />
            {selectedIds.size === filtered.length && filtered.length > 0 ? "Deselect All" : "Select All"}
          </Button>
          {(searchQuery || filterRoom !== "all") && (
            <Button variant="outline" size="sm" className="border-white/20 text-white/60 bg-transparent"
              onClick={() => { setSearchQuery(""); setFilterRoom("all"); }}>
              <X size={14} className="mr-1" /> Clear
            </Button>
          )}
        </div>
      )}

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-20 flex items-center gap-3 p-4 rounded-xl bg-[#1a1a2e] border border-amber-400/30 shadow-lg shadow-amber-400/10">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-black text-xs font-bold">
              {selectedIds.size}
            </div>
            <span className="text-white font-medium text-sm">
              {selectedIds.size} photo{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-amber-400 hover:bg-amber-500 text-black font-semibold"
            onClick={handleUseInPropertyTour}
          >
            <Video size={14} /> Use in Property Slideshow
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-amber-400/40 text-amber-400 bg-transparent hover:bg-amber-400/10"
            onClick={handleUseInCinematicTour}
          >
            <Video size={14} /> Use in AI Motion Tour
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/40 hover:text-white"
            onClick={clearSelection}
          >
            <X size={14} />
          </Button>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">{images.length === 0 ? "No photos yet" : "No photos match your filter"}</p>
          <p className="text-sm mt-1">{images.length === 0 ? "Upload your first property photos above" : "Try adjusting your search or filter"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((img) => (
            <ImageCard
              key={img.id}
              image={img}
              onDelete={(id) => deleteMutation.mutate({ imageId: id })}
              onGenerateHook={(id, url, roomType) => {
                setGeneratingHookFor(id);
                generateHookMutation.mutate({ imageId: id, imageUrl: url, roomType: roomType ?? undefined });
              }}
              onSelect={setSelectedImage}
              isGeneratingHook={generatingHookFor === img.id}
              isSelected={selectedIds.has(img.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl bg-[#0f0f1a] border-white/20 text-white p-0 overflow-hidden">
          {selectedImage && (
            <>
              <div className="relative">
                <img src={selectedImage.url} alt={selectedImage.filename} className="w-full max-h-[55vh] object-contain bg-black" />
                {selectedImage.hookText && <HookOverlay hookText={selectedImage.hookText} />}
              </div>
              <div className="p-5 space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-white text-lg">{selectedImage.filename}</DialogTitle>
                </DialogHeader>

                {/* Quick actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-2 bg-amber-400 hover:bg-amber-500 text-black font-semibold text-xs"
                    onClick={() => {
                      const encoded = encodeURIComponent(JSON.stringify([selectedImage.url]));
                      navigate(`/property-tours?libraryImages=${encoded}`);
                      setSelectedImage(null);
                    }}
                  >
                    <Video size={12} /> Use in Property Slideshow
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-amber-400/40 text-amber-400 bg-transparent hover:bg-amber-400/10 text-xs"
                    onClick={() => {
                      const encoded = encodeURIComponent(JSON.stringify([selectedImage.url]));
                      navigate(`/cinematic-walkthrough?libraryImages=${encoded}`);
                      setSelectedImage(null);
                    }}
                  >
                    <Video size={12} /> Use in AI Motion Tour
                  </Button>
                </div>

                {/* Hook */}
                {selectedImage.hookText ? (
                  <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-3">
                    <p className="text-amber-400 text-xs font-medium mb-1 flex items-center gap-1"><Sparkles size={12} /> AI Hook</p>
                    <p className="text-white font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      "{selectedImage.hookText}"
                    </p>
                    <Button size="sm" variant="outline"
                      className="mt-2 text-xs border-amber-400/30 text-amber-400 bg-transparent hover:bg-amber-400/10"
                      onClick={() => {
                        setGeneratingHookFor(selectedImage.id);
                        generateHookMutation.mutate({ imageId: selectedImage.id, imageUrl: selectedImage.url, roomType: selectedImage.roomType ?? undefined });
                      }}
                      disabled={generatingHookFor === selectedImage.id}>
                      {generatingHookFor === selectedImage.id ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                      Regenerate Hook
                    </Button>
                  </div>
                ) : (
                  <Button className="bg-amber-400 hover:bg-amber-500 text-black font-semibold"
                    onClick={() => {
                      setGeneratingHookFor(selectedImage.id);
                      generateHookMutation.mutate({ imageId: selectedImage.id, imageUrl: selectedImage.url, roomType: selectedImage.roomType ?? undefined });
                    }}
                    disabled={generatingHookFor === selectedImage.id}>
                    {generatingHookFor === selectedImage.id ? <Loader2 size={14} className="animate-spin mr-2" /> : <Sparkles size={14} className="mr-2" />}
                    Generate AI Hook
                  </Button>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-white/40 text-xs mb-1">Room Type</p>
                    <Select
                      value={selectedImage.roomType || ""}
                      onValueChange={(val) => {
                        updateMutation.mutate({ imageId: selectedImage.id, roomType: val });
                        setSelectedImage({ ...selectedImage, roomType: val });
                      }}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white h-8 text-sm">
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/20 text-white">
                        {ROOM_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Property Address</p>
                    <Input
                      defaultValue={selectedImage.propertyAddress || ""}
                      placeholder="123 Main St"
                      className="bg-white/5 border-white/20 text-white h-8 text-sm"
                      onBlur={(e) => {
                        if (e.target.value !== selectedImage.propertyAddress) {
                          updateMutation.mutate({ imageId: selectedImage.id, propertyAddress: e.target.value });
                          setSelectedImage({ ...selectedImage, propertyAddress: e.target.value });
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <p className="text-white/40 text-xs mb-2 flex items-center gap-1"><Tag size={12} /> Tags</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedImage.tags.map((tag) => (
                      <Badge key={tag} variant="outline"
                        className="border-white/20 text-white/70 cursor-pointer hover:border-red-400/50 hover:text-red-400"
                        onClick={() => {
                          const newTags = selectedImage.tags.filter((t) => t !== tag);
                          updateMutation.mutate({ imageId: selectedImage.id, tags: newTags });
                          setSelectedImage({ ...selectedImage, tags: newTags });
                        }}>
                        {tag} <X size={10} className="ml-1" />
                      </Badge>
                    ))}
                    <div className="flex gap-1">
                      <Input
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && tagInput.trim()) {
                            const newTags = [...selectedImage.tags, tagInput.trim()];
                            updateMutation.mutate({ imageId: selectedImage.id, tags: newTags });
                            setSelectedImage({ ...selectedImage, tags: newTags });
                            setTagInput("");
                          }
                        }}
                        className="bg-white/5 border-white/20 text-white h-7 text-xs w-28"
                      />
                      <Button size="sm" variant="outline" className="h-7 px-2 border-white/20 text-white/60 bg-transparent"
                        onClick={() => {
                          if (tagInput.trim()) {
                            const newTags = [...selectedImage.tags, tagInput.trim()];
                            updateMutation.mutate({ imageId: selectedImage.id, tags: newTags });
                            setSelectedImage({ ...selectedImage, tags: newTags });
                            setTagInput("");
                          }
                        }}>
                        <Plus size={12} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Delete */}
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <p className="text-white/30 text-xs">
                    {selectedImage.sizeBytes ? `${(selectedImage.sizeBytes / 1024).toFixed(0)} KB · ` : ""}
                    {selectedImage.mimeType}
                  </p>
                  <Button size="sm" variant="outline"
                    className="border-red-400/30 text-red-400 bg-transparent hover:bg-red-400/10"
                    onClick={() => deleteMutation.mutate({ imageId: selectedImage.id })}>
                    <Trash2 size={12} className="mr-1" /> Delete Photo
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
