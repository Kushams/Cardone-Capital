"use client";
import { useRef, useState } from "react";

/** Real signature capture: the investor draws their signature on the pad; the PNG
 * travels with the form and is embedded into the executed PDF, with the image and
 * a signing record retained by the firm. */
export default function SignForm({ action, error }: { action: (f: FormData) => void | Promise<void>; error?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [drawn, setDrawn] = useState(false);
  const [localError, setLocalError] = useState("");
  const [img, setImg] = useState("");

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    last.current = pos(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.strokeStyle = "#10243e";
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!drawn) setDrawn(true);
  };
  const up = () => {
    drawing.current = false;
    if (canvasRef.current && drawn) setImg(canvasRef.current.toDataURL("image/png"));
  };
  const clear = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setDrawn(false);
    setImg("");
  };

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!drawn) {
          e.preventDefault();
          setLocalError("Draw your signature in the box first — with your mouse, finger or stylus.");
        }
      }}
      className="mt-5 space-y-4"
    >
      <p className="text-sm">By signing below, you declare that all details listed on the Summary page are true and complete.</p>
      <div>
        <span className="label">Draw your signature</span>
        <canvas
          ref={canvasRef}
          width={1120}
          height={300}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="w-full border hair rounded bg-white touch-none cursor-crosshair"
          style={{ aspectRatio: "1120 / 300" }}
          aria-label="Signature pad"
        />
        <div className="flex items-center gap-4 mt-1">
          <button type="button" onClick={clear} className="text-sm underline">Clear</button>
          <span className="text-xs muted">Your drawn signature will appear on the executed copy.</span>
        </div>
      </div>
      <input type="hidden" name="signatureImage" value={img} />
      <label className="block"><span className="label">Type your full name (printed name)</span><input name="signature" required minLength={2} autoComplete="off" className="input max-w-[420px]" /></label>
      <label className="flex items-center gap-2"><input type="checkbox" name="confirm" required /> I confirm the details are true and complete.</label>
      {error === "1" && <p role="alert" className="text-danger text-sm">Please type your full name and confirm to sign.</p>}
      {error === "2" && <p role="alert" className="text-danger text-sm">We couldn’t read your signature — please draw it again and sign.</p>}
      {localError && <p role="alert" className="text-danger text-sm">{localError}</p>}
      <button className="btn btn-primary px-8">Sign</button>
    </form>
  );
}
