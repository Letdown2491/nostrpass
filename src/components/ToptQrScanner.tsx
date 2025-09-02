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
  const [warning, setWarning] = React.useState<string | null>(null);
  const startRef = React.useRef<() => void>();

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let detector: any;
    let reader: BrowserMultiFormatReader | null = null;
    let controls: IScannerControls | null = null;
    let active = true;
    const maxFrames = 300;
    let frameCount = 0;

    const scan = async () => {
      if (!active || !videoRef.current) return;

      try {
        if (detector) {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            if (stream) {
              stream.getTracks().forEach((t) => t.stop());
              stream = null;
            }
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.srcObject = null;
            }
            onScan(codes[0].rawValue);
            onClose();
            return;
          }
          frameCount++;
          if (frameCount >= maxFrames) {
            console.warn(
              "BarcodeDetector timeout, falling back to BrowserMultiFormatReader",
            );
            setWarning(
              "Falling back to slower scanner, detection may take longer.",
            );
            detector = null;
            if (stream) {
              stream.getTracks().forEach((t) => t.stop());
              stream = null;
            }
            if (videoRef.current) videoRef.current.srcObject = null;
            reader = new BrowserMultiFormatReader();
            try {
              controls = await reader.decodeFromVideoDevice(
                undefined,
                videoRef.current,
                (result: any) => {
                  if (result) {
                    controls?.stop();
                    if (videoRef.current) {
                      const s = videoRef.current
                        .srcObject as MediaStream | null;
                      if (s) s.getTracks().forEach((t) => t.stop());
                      videoRef.current.pause();
                      videoRef.current.srcObject = null;
                    }
                    onScan(result.getText());
                    onClose();
                  }
                },
              );
            } catch (err) {
              console.error("fallback scanner error", err);
            }
            return;
          }
        }
      } catch (e) {}
      requestAnimationFrame(scan);
    };

    const start = async () => {
      frameCount = 0;
      try {
        if ("BarcodeDetector" in window) {
          // @ts-ignore
          detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          if (!active) return;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            try {
              await videoRef.current.play();
            } catch (err: any) {
              if (err?.name !== "AbortError") throw err;
              return;
            }
          }

          if (!active) return;
          requestAnimationFrame(scan);
        } else {
          reader = new BrowserMultiFormatReader();
          controls = await reader.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result: any) => {
              if (result) {
                controls?.stop();
                if (videoRef.current) {
                  const s = videoRef.current.srcObject as MediaStream | null;
                  if (s) s.getTracks().forEach((t) => t.stop());
                  videoRef.current.pause();
                  videoRef.current.srcObject = null;
                }
                onScan(result.getText());
                onClose();
              }
            },
          );
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("camera error", err);
          if (err.name === "NotAllowedError") {
            setError(
              "Camera permission denied. Enable camera access and try again.",
            );
          } else if (err.name === "NotFoundError") {
            setError("No camera device found.");
          } else {
            setError(err?.message || "Camera error");
          }
        }
      }
    };

    startRef.current = start;
    start();

    return () => {
      active = false;
      controls?.stop();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-50 p-4 rounded-lg border border-slate-700 bg-slate-900">
        {error ? (
          <div className="text-rose-400 mb-2">{error}</div>
        ) : (
          <>
            {warning && <div className="text-amber-400 mb-2">{warning}</div>}
            <video ref={videoRef} className="w-64 h-64" />
          </>
        )}
        <div className="flex justify-end mt-2 space-x-2">
          {error && (
            <button
              type="button"
              className="px-3 py-1 rounded-lg border border-slate-600 hover:bg-slate-600/10"
              onClick={() => {
                setError(null);
                setWarning(null);
                startRef.current?.();
              }}
            >
              Retry
            </button>
          )}
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
