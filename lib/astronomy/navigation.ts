export function buildDestinationSkyHref(input: { baseHref: string; mode: "live-night" | "night-preview"; previewId?: string }) {
  if (!input.baseHref.startsWith("/") || input.baseHref.startsWith("//")) throw new Error("Destination sky href must be a local route");
  const base = input.baseHref.split("#")[0];
  if (input.mode === "live-night") return `${base}#night-sky`;
  if (!input.previewId?.trim()) throw new Error("Preview mode requires previewId");
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}skyPreview=${encodeURIComponent(input.previewId)}#night-sky`;
}
