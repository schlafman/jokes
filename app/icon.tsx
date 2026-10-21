import { renderAppIcon } from "./iconArt";

// PWA icons served at /icon/192 and /icon/512.
const SIZES = [192, 512];

export function generateImageMetadata() {
  return SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  return renderAppIcon(Number(await id));
}
