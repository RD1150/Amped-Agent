import { useRef, useState, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Crop as CropIcon, Check, RotateCcw } from "lucide-react";

interface HeadshotCropperProps {
  /** The raw File selected by the user */
  file: File;
  /** Called with the cropped File (PNG, 800×800) when user confirms */
  onConfirm: (croppedFile: File) => void;
  /** Called when user dismisses without cropping */
  onCancel: () => void;
}

function centerSquareCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, 1, width, height),
    width,
    height
  );
}

async function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  outputSize = 800
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d")!;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/png",
      1
    );
  });
}

export default function HeadshotCropper({ file, onConfirm, onCancel }: HeadshotCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerSquareCrop(width, height));
  }, []);

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const croppedFile = new File([blob], "headshot.png", { type: "image/png" });
      onConfirm(croppedFile);
    } catch {
      // fallback: just use original
      onConfirm(file);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = useCallback(() => {
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    setCrop(centerSquareCrop(width, height));
    setCompletedCrop(undefined);
  }, []);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-4 w-4 text-primary" />
            Crop Your Headshot
          </DialogTitle>
          <DialogDescription>
            Drag the square to frame your face. Keep your head centred with space above — the crop will be exported as an 800×800 px PNG.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {/* Crop area */}
          <div className="w-full max-h-[420px] overflow-auto flex justify-center rounded-lg bg-muted/30 border border-border p-2">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              minWidth={80}
              minHeight={80}
              keepSelection
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Headshot to crop"
                onLoad={onImageLoad}
                className="max-w-full max-h-[400px] object-contain"
              />
            </ReactCrop>
          </div>

          {/* Tips */}
          <div className="w-full text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 space-y-0.5">
            <p className="font-semibold text-amber-700 dark:text-amber-400">Framing tips for best avatar quality:</p>
            <p>• Face should fill <strong>50–70%</strong> of the square height</p>
            <p>• Leave <strong>~20% headroom</strong> above the top of your hair</p>
            <p>• Include neck and top of shoulders at the bottom</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="ml-auto"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!completedCrop || isProcessing}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isProcessing ? (
                <>Processing…</>
              ) : (
                <><Check className="h-3.5 w-3.5" />Use This Crop</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
