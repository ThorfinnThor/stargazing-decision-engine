import type { NightPreview, SkyLocation } from "./types";

export function resolveDestinationPreview(input: { previewId: string | null; previews: readonly NightPreview[]; location: SkyLocation }) {
  if (!input.previewId) return null;
  return input.previews.find((preview) => preview.id === input.previewId
    && preview.destinationId === input.location.destinationId
    && preview.destinationSlug === input.location.destinationSlug
    && preview.siteId === input.location.siteId) ?? null;
}
