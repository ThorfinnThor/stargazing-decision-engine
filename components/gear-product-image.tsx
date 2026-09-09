import Image from "next/image";
import { affiliateRel } from "@/lib/affiliate/affiliate";
import type { GearProductImage as ProductImage } from "@/lib/gear/product-images";

export function GearProductImage({ image, name, href }: { image: ProductImage; name: string; href: string }) {
  return <a className="gear-product-image" href={href} target="_blank" rel={`${affiliateRel()} noopener noreferrer`}>
    <Image src={image.src} alt={name} width={image.width} height={image.height} loading="lazy" unoptimized referrerPolicy="no-referrer" />
  </a>;
}
