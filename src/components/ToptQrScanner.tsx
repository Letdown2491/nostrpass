import React from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

export default function TotpQrScanner({
  onScan,
  onClose,
}: {
  onScan: (data: string) => void;
  onClose: () => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let stream: MediaStream;
    let detector: any;
    let reader: BrowserMultiFormatReader | null = null;
    let controls: IScannerControls | null = null;
    let active = true;

    const scan = async () => {
      if (!active || !videoRef.current) return;

      try {
        if (detector) {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            onScan(codes[0].rawValue);
            return;
          }
        }
      } catch (e) {}
      requestAnimationFrame(scan);
    };

    const start = async () => {
      try {
        if ("BarcodeDetector" in window) {
          // @ts-ignore
          detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        } else {
          reader = new BrowserMultiFormatReader();
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (active) {
          try {
            await videoRef.current.play();
          } catch (err: any) {
            if (err?.name !== "AbortError") throw err;
            return;
          }
        }
        if (!active) return;
        if (detector) {
          requestAnimationFrame(scan);
        } else if (reader) {
          controls = await reader.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result: any) => {
              if (result) onScan(result.getText());
            },
          );
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("camera error", err);
          setError(err?.message || "Camera error");
        }
      }
    };

    start();

    return () => {
      active = false;
      controls?.stop();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-999 p-4 rounded-lg border border-slate-700 bg-slate-900">
        {error ? (
          <div className="text-rose-400 mb-2">{error}</div>
        ) : (
          <video ref={videoRef} className="w-64 h-64" />
        )}
        <div className="flex justify-end mt-2">
          <button
            type="button"
            className="px-3 py-1 rounded-lg border border-slate-600 hover:bg-slate-600/10"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
