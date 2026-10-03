import type { BagItem, BagCategory } from "../types/index.ts";

/** Normalized from docs/reference/tailfin-catalog.json, researched 2026-10-02.
 * Exact source SHA256: ea32a265df7f854a35815ab0121ceb820026e82e36c66332866c912b7396cd84.
 * Source facts remain separate from illustrative renderer envelopes. No vendor assets are bundled.
 * The source enumerates 50 main families + 95 spares, with 191 variant records;
 * banner counters say 52 and 96, so this is an indexed snapshot, not certified exhaustive SKU coverage.
 */
interface SourceVariant {
  label: string;
  capacity_l: number | null;
  weight_g: number | null;
  dimensions_mm: Record<string, number> | null;
  bar_clamp_weight_g?: number;
  pocket_capacity_l?: number;
  min_capacity_l?: number;
  [key: string]: unknown;
}
interface SourceProduct {
  id: string;
  name: string;
  catalog_section: string;
  category: string;
  role: string;
  mount_zone: string;
  variants: SourceVariant[];
  source_url: string;
}
export const TAILFIN_SOURCE_PRODUCTS: SourceProduct[] = [
  {
    id: "tailfin-913333",
    name: "CargoPack System",
    catalog_section: "main",
    category: "Rear Systems",
    role: "bike-component",
    mount_zone: "rear-system",
    variants: [
      {
        label: "Carbon / Fast Release / without pannier mounts",
        capacity_l: 18,
        weight_g: 922,
        dimensions_mm: {
          length: 430,
          width_front: 128,
          width_rear: 165,
          height_front_unrolled: 380,
          height_rear_unrolled: 420,
        },
        pocket_capacity_l: 3,
      },
      {
        label: "Carbon / Fast Release / with pannier mounts",
        capacity_l: 18,
        weight_g: 1000,
        dimensions_mm: {
          length: 430,
          width_front: 128,
          width_rear: 165,
          height_front_unrolled: 380,
          height_rear_unrolled: 420,
        },
        pocket_capacity_l: 3,
      },
      {
        label: "Carbon / Direct Mount / without pannier mounts",
        capacity_l: 18,
        weight_g: 881,
        dimensions_mm: {
          length: 430,
          width_front: 128,
          width_rear: 165,
          height_front_unrolled: 380,
          height_rear_unrolled: 420,
        },
        pocket_capacity_l: 3,
      },
      {
        label: "Carbon / Direct Mount / with pannier mounts",
        capacity_l: 18,
        weight_g: 959,
        dimensions_mm: {
          length: 430,
          width_front: 128,
          width_rear: 165,
          height_front_unrolled: 380,
          height_rear_unrolled: 420,
        },
        pocket_capacity_l: 3,
      },
      {
        label: "Alloy / Fast Release / without pannier mounts",
        capacity_l: 18,
        weight_g: 1129,
        dimensions_mm: {
          length: 430,
          width_front: 128,
          width_rear: 165,
          height_front_unrolled: 380,
          height_rear_unrolled: 420,
        },
        pocket_capacity_l: 3,
      },
      {
        label: "Alloy / Fast Release / with pannier mounts",
        capacity_l: 18,
        weight_g: 1230,
        dimensions_mm: {
          length: 430,
          width_front: 128,
          width_rear: 165,
          height_front_unrolled: 380,
          height_rear_unrolled: 420,
        },
        pocket_capacity_l: 3,
      },
      {
        label: "Alloy / Direct Mount / without pannier mounts",
        capacity_l: 18,
        weight_g: 1088,
        dimensions_mm: {
          length: 430,
          width_front: 128,
          width_rear: 165,
          height_front_unrolled: 380,
          height_rear_unrolled: 420,
        },
        pocket_capacity_l: 3,
      },
      {
        label: "Alloy / Direct Mount / with pannier mounts",
        capacity_l: 18,
        weight_g: 1189,
        dimensions_mm: {
          length: 430,
          width_front: 128,
          width_rear: 165,
          height_front_unrolled: 380,
          height_rear_unrolled: 420,
        },
        pocket_capacity_l: 3,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/cargopack/",
  },
  {
    id: "tailfin-894178",
    name: "SpeedPack System",
    catalog_section: "main",
    category: "Rear Systems",
    role: "bike-component",
    mount_zone: "rear-system",
    variants: [
      {
        label: "Carbon / Fast Release / without pannier mounts",
        capacity_l: 10,
        weight_g: 700,
        dimensions_mm: { length: 435, width_rear: 185 },
        pocket_capacity_l: 3,
      },
      {
        label: "Carbon / Fast Release / with pannier mounts",
        capacity_l: 10,
        weight_g: 778,
        dimensions_mm: { length: 435, width_rear: 185 },
        pocket_capacity_l: 3,
      },
      {
        label: "Alloy / Fast Release / without pannier mounts",
        capacity_l: 10,
        weight_g: 907,
        dimensions_mm: { length: 435, width_rear: 185 },
        pocket_capacity_l: 3,
      },
      {
        label: "Alloy / Fast Release / with pannier mounts",
        capacity_l: 10,
        weight_g: 1008,
        dimensions_mm: { length: 435, width_rear: 185 },
        pocket_capacity_l: 3,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/speedpack/",
  },
  {
    id: "tailfin-1008020",
    name: "Journey Pannier Rack",
    catalog_section: "main",
    category: "Bike Racks",
    role: "bike-component",
    mount_zone: "rear-rack",
    variants: [
      {
        label: "With pannier mounts",
        capacity_l: null,
        weight_g: 740,
        dimensions_mm: null,
      },
      {
        label: "Without pannier mounts",
        capacity_l: null,
        weight_g: 580,
        dimensions_mm: null,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/journey-pannier-rack/",
  },
  {
    id: "tailfin-895075",
    name: "Carbon Pannier Rack",
    catalog_section: "main",
    category: "Bike Racks",
    role: "bike-component",
    mount_zone: "rear-rack",
    variants: [
      {
        label: "With pannier mounts",
        capacity_l: null,
        weight_g: 317,
        dimensions_mm: null,
      },
      {
        label: "Without pannier mounts",
        capacity_l: null,
        weight_g: 317,
        dimensions_mm: null,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/carbon-pannier-rack/",
  },
  {
    id: "tailfin-723748",
    name: "Bar Bag System",
    catalog_section: "main",
    category: "Bar Bags",
    role: "bike-component",
    mount_zone: "handlebar",
    variants: [
      {
        label: "Drop bar Small",
        capacity_l: 9.1,
        weight_g: 552,
        dimensions_mm: { diameter: 160 },
        min_capacity_l: 4,
        bar_clamp_weight_g: 181,
        pocket_capacity_l: 1.6,
      },
      {
        label: "Drop bar Large",
        capacity_l: 12.5,
        weight_g: 636,
        dimensions_mm: { diameter: 180 },
        min_capacity_l: 6.7,
        bar_clamp_weight_g: 181,
        pocket_capacity_l: 2.7,
      },
      {
        label: "Flat bar Small",
        capacity_l: 14.7,
        weight_g: 604,
        dimensions_mm: { diameter: 160 },
        min_capacity_l: 5.8,
        bar_clamp_weight_g: 181,
        pocket_capacity_l: 2.7,
      },
      {
        label: "Flat bar Large",
        capacity_l: 18.9,
        weight_g: 679,
        dimensions_mm: { diameter: 180 },
        min_capacity_l: 8.7,
        bar_clamp_weight_g: 181,
        pocket_capacity_l: 3.5,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/bar-bag-system/",
  },
  {
    id: "tailfin-825745",
    name: "Bar Cage (+ Bag)",
    catalog_section: "main",
    category: "Bar Systems",
    role: "bike-component",
    mount_zone: "handlebar",
    variants: [
      {
        label: "Cage only",
        capacity_l: null,
        weight_g: 277,
        dimensions_mm: null,
      },
      {
        label: "Cage + Small bag",
        capacity_l: 8,
        weight_g: 499,
        dimensions_mm: null,
      },
      {
        label: "Cage + Medium bag",
        capacity_l: 11,
        weight_g: 532,
        dimensions_mm: null,
      },
      {
        label: "Cage + Large bag",
        capacity_l: 15,
        weight_g: 562,
        dimensions_mm: null,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/product/bar-systems/bar-cage/",
  },
  {
    id: "tailfin-851925",
    name: "Bar Cage Bag",
    catalog_section: "main",
    category: "Cage Packs",
    role: "bike-component",
    mount_zone: "handlebar",
    variants: [
      {
        label: "Small",
        capacity_l: 8,
        weight_g: 222,
        dimensions_mm: { length_min: 360, length_max: 540, diameter: 135 },
      },
      {
        label: "Medium",
        capacity_l: 11,
        weight_g: 255,
        dimensions_mm: { length_min: 370, length_max: 540, diameter: 165 },
      },
      {
        label: "Large",
        capacity_l: 15,
        weight_g: 285,
        dimensions_mm: { length_min: 380, length_max: 560, diameter: 180 },
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/cargo-cage-system/cage-packs/bar-cage-bag/",
  },
  {
    id: "tailfin-732053",
    name: "Long Top Tube Bag",
    catalog_section: "main",
    category: "Top Tube Bags",
    role: "bike-component",
    mount_zone: "top-tube",
    variants: [
      {
        label: "1.6L",
        capacity_l: 1.6,
        weight_g: 241,
        dimensions_mm: null,
        weight_direct_mount_plus_one_strap_g: 229,
      },
      {
        label: "2.2L",
        capacity_l: 2.2,
        weight_g: 281,
        dimensions_mm: null,
        weight_direct_mount_plus_one_strap_g: 273,
      },
      {
        label: "3L",
        capacity_l: 3,
        weight_g: 300,
        dimensions_mm: null,
        weight_direct_mount_plus_one_strap_g: 288,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/top-tube-cockpit/long-top-tube-bag/",
  },
  {
    id: "tailfin-968191",
    name: "Pannier Bags",
    catalog_section: "main",
    category: "Rear Pannier Bags",
    role: "bike-component",
    mount_zone: "rear-side",
    variants: [
      { label: "16L", capacity_l: 16, weight_g: 564, dimensions_mm: null },
      { label: "22L", capacity_l: 22, weight_g: 780, dimensions_mm: null },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/pannier-rack-top-bags/rear-pannier-bags/panniers/",
  },
  {
    id: "tailfin-972100",
    name: "Mini Panniers",
    catalog_section: "main",
    category: "Rear Pannier Bags",
    role: "bike-component",
    mount_zone: "rear-side",
    variants: [
      { label: "5L", capacity_l: 5, weight_g: 310, dimensions_mm: null },
      { label: "10L", capacity_l: 10, weight_g: 380, dimensions_mm: null },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/pannier-rack-top-bags/rear-pannier-bags/mini-panniers/",
  },
  {
    id: "tailfin-959100",
    name: "HydroMount",
    catalog_section: "main",
    category: "Accessories",
    role: "bike-component",
    mount_zone: "bottle-mount",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/product/accessories/hydromount/",
  },
  {
    id: "tailfin-1051880",
    name: "Top Tube Bag",
    catalog_section: "main",
    category: "Top Tube Bags",
    role: "bike-component",
    mount_zone: "top-tube",
    variants: [
      {
        label: "0.8L Zip",
        capacity_l: 0.8,
        weight_g: 150,
        dimensions_mm: null,
        weight_direct_mount_g: 138,
      },
      {
        label: "1.1L Zip",
        capacity_l: 1.1,
        weight_g: 166,
        dimensions_mm: null,
        weight_direct_mount_g: 154,
      },
      {
        label: "1.1L Flip",
        capacity_l: 1.1,
        weight_g: 180,
        dimensions_mm: null,
        weight_direct_mount_g: 168,
      },
      {
        label: "1.5L Zip",
        capacity_l: 1.5,
        weight_g: 190,
        dimensions_mm: null,
        weight_direct_mount_g: 178,
      },
      {
        label: "1.5L Flip",
        capacity_l: 1.5,
        weight_g: null,
        dimensions_mm: null,
        weight_direct_mount_g: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/top-tube-cockpit/top-tube-bag/",
  },
  {
    id: "tailfin-1006881",
    name: "Half Frame Bag",
    catalog_section: "main",
    category: "Frame Bags",
    role: "bike-component",
    mount_zone: "frame",
    variants: [
      {
        label: "2.3L",
        capacity_l: 2.3,
        weight_g: 248,
        dimensions_mm: null,
        weight_without_straps_g: 200,
      },
      {
        label: "3L",
        capacity_l: 3,
        weight_g: 290,
        dimensions_mm: null,
        weight_without_straps_g: 242,
      },
      {
        label: "3.8L",
        capacity_l: 3.8,
        weight_g: 332,
        dimensions_mm: null,
        weight_without_straps_g: 284,
      },
      {
        label: "4.5L",
        capacity_l: 4.5,
        weight_g: 350,
        dimensions_mm: null,
        weight_without_straps_g: 302,
      },
      {
        label: "5.3L",
        capacity_l: 5.3,
        weight_g: 364,
        dimensions_mm: null,
        weight_without_straps_g: 316,
      },
      {
        label: "6.5L",
        capacity_l: 6.5,
        weight_g: 382,
        dimensions_mm: null,
        weight_without_straps_g: 334,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/product/frame-bags/half-frame-bag/",
  },
  {
    id: "tailfin-1006882",
    name: "Wedge Frame Bag",
    catalog_section: "main",
    category: "Frame Bags",
    role: "bike-component",
    mount_zone: "frame",
    variants: [
      {
        label: "1.9L",
        capacity_l: 1.9,
        weight_g: 208,
        dimensions_mm: null,
        weight_without_straps_g: 170,
      },
      {
        label: "2.7L",
        capacity_l: 2.7,
        weight_g: 232,
        dimensions_mm: null,
        weight_without_straps_g: 194,
      },
      {
        label: "3.5L",
        capacity_l: 3.5,
        weight_g: 277.6,
        dimensions_mm: null,
        weight_without_straps_g: 230,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/product/frame-bags/wedge-frame-bag/",
  },
  {
    id: "tailfin-798331",
    name: "Rear Top Tube Bag",
    catalog_section: "main",
    category: "Top Tube Bags",
    role: "bike-component",
    mount_zone: "rear-top-tube",
    variants: [
      {
        label: "Road/Gravel 0.9L",
        capacity_l: 0.9,
        weight_g: 109,
        dimensions_mm: null,
        weight_three_straps_g: 118,
      },
      {
        label: "MTB 0.8L",
        capacity_l: 0.8,
        weight_g: 112,
        dimensions_mm: null,
        weight_three_straps_g: 121,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/top-tube-cockpit/rear-top-tube-bag/",
  },
  {
    id: "tailfin-56316",
    name: "Cage Packs",
    catalog_section: "main",
    category: "Cage Packs",
    role: "bike-component",
    mount_zone: "cargo-mount",
    variants: [
      { label: "1.7L", capacity_l: 1.7, weight_g: 115, dimensions_mm: null },
      { label: "3L", capacity_l: 3, weight_g: 154, dimensions_mm: null },
      { label: "5L", capacity_l: 5, weight_g: 183, dimensions_mm: null },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/cargo-cage-system/cage-packs/cage-packs/",
  },
  {
    id: "tailfin-129268",
    name: "Downtube Packs",
    catalog_section: "main",
    category: "Frame Bags",
    role: "bike-component",
    mount_zone: "downtube",
    variants: [
      { label: "1.7L", capacity_l: 1.7, weight_g: 210, dimensions_mm: null },
      { label: "3L", capacity_l: 3, weight_g: 277, dimensions_mm: null },
    ],
    source_url: "https://www.tailfin.cc/ca/product/frame-bags/downtube-packs/",
  },
  {
    id: "tailfin-32010",
    name: "Cargo Cages",
    catalog_section: "main",
    category: "Cargo Cages",
    role: "bike-component",
    mount_zone: "cargo-mount",
    variants: [
      {
        label: "Small",
        capacity_l: null,
        weight_g: 57,
        dimensions_mm: { length: 157, width: 72, depth: 16 },
        load_chip_weight_g: 11,
      },
      {
        label: "Large",
        capacity_l: null,
        weight_g: 79,
        dimensions_mm: { length: 221, width: 72, depth: 16 },
        load_chip_weight_g: 11,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/cargo-cage-system/cargo-cages/cargo-cage/",
  },
  {
    id: "tailfin-34167",
    name: "Universal Thru Axle",
    catalog_section: "main",
    category: "Axles",
    role: "bike-component",
    mount_zone: "rear-axle",
    variants: [
      {
        label: "Universal kit",
        capacity_l: null,
        weight_g: 63.4,
        dimensions_mm: null,
        thread_pitch_options_mm: [1, 1.5, 1.75],
        additional_thread: "1.0mm double lead Mavic Speed Release",
      },
    ],
    source_url: "https://www.tailfin.cc/ca/product/axles/universal-thru-axle/",
  },
  {
    id: "tailfin-732058",
    name: "Long Top Tube Bag Accessory Pack",
    catalog_section: "main",
    category: "Accessories",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/long-top-tube-bag-accessory-pack/",
  },
  {
    id: "tailfin-729569",
    name: "Bar Bag System Accessories",
    catalog_section: "main",
    category: "Bar Bag Accessories",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/bar-bag-accessories/bar-bag-system-accessories/",
  },
  {
    id: "tailfin-1012933",
    name: "Bar Cage Mount - Computer Mount",
    catalog_section: "main",
    category: "Accessories",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/bar-cage-mount-cmk/",
  },
  {
    id: "tailfin-1012929",
    name: "Bar Cage Mount - 22mm",
    catalog_section: "main",
    category: "Bar Bag Accessories",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/bar-bag-accessories/bar-cage-mount-22mm/",
  },
  {
    id: "tailfin-670",
    name: "CargoPack Rack Top Bag",
    catalog_section: "main",
    category: "Rack Top Bags",
    role: "bike-component",
    mount_zone: "rack-top",
    variants: [
      {
        label: "18L",
        capacity_l: 18,
        weight_g: 682,
        dimensions_mm: {
          length: 435,
          width_rear: 164,
          width_front: 128,
          height_rear_unrolled: 420,
          height_front_unrolled: 380,
        },
        pocket_capacity_l: 3,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/pannier-rack-top-bags/rack-top-bags/cargopack-top-bag/",
  },
  {
    id: "tailfin-42733",
    name: "Suspension Fork Mounts",
    catalog_section: "main",
    category: "Suspension Fork Mounts",
    role: "bike-component",
    mount_zone: "fork-mount",
    variants: [
      {
        label: "Carbon",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
      {
        label: "Stainless Steel",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/cargo-cage-system/suspension-fork-mounts/suspension-fork-mount/",
  },
  {
    id: "tailfin-361",
    name: "QR Axle",
    catalog_section: "main",
    category: "Axles",
    role: "bike-component",
    mount_zone: "rear-axle",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/product/axles/qr-axle/",
  },
  {
    id: "tailfin-930095",
    name: "SpeedPack Rack Top Bag",
    catalog_section: "main",
    category: "Rack Top Bags",
    role: "bike-component",
    mount_zone: "rack-top",
    variants: [
      {
        label: "10L",
        capacity_l: 10,
        weight_g: 430,
        dimensions_mm: { length: 435, width_rear: 185 },
        pocket_capacity_l: 3,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/pannier-rack-top-bags/rack-top-bags/speedpack-top-bag/",
  },
  {
    id: "tailfin-20115",
    name: "Third-Party Pannier Adaptors",
    catalog_section: "main",
    category: "Rack Bag Accessories",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/third-party-pannier-adaptors/",
  },
  {
    id: "tailfin-46283",
    name: "Mini Cage",
    catalog_section: "main",
    category: "Cargo Cages",
    role: "bike-component",
    mount_zone: "cargo-mount",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/cargo-cage-system/cargo-cages/mini-cage/",
  },
  {
    id: "tailfin-655674",
    name: "Fork Packs",
    catalog_section: "main",
    category: "Fork Packs",
    role: "bike-component",
    mount_zone: "fork-side",
    variants: [
      { label: "5L", capacity_l: 5, weight_g: 387, dimensions_mm: null },
      { label: "10L", capacity_l: 10, weight_g: 467, dimensions_mm: null },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/pannier-rack-top-bags/fork-packs/fork-packs/",
  },
  {
    id: "tailfin-1029289",
    name: "Journey Rack Mudguard",
    catalog_section: "main",
    category: "Rack ",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/journey-rack-mudguard/",
  },
  {
    id: "tailfin-1027471",
    name: "Garmin Varia / Wahoo Trackr Light Mount",
    catalog_section: "main",
    category: "Rack ",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/garmin-varia-wahoo-trackr-light-mount/",
  },
  {
    id: "tailfin-1027465",
    name: "Cateye Nano Light Mount",
    catalog_section: "main",
    category: "Rack ",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/cateye-nano-light-mount/",
  },
  {
    id: "tailfin-1027459",
    name: "Seatpost Mimic Light Mount",
    catalog_section: "main",
    category: "Rack ",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/seatpost-mimic-light-mount/",
  },
  {
    id: "tailfin-1027462",
    name: "Exposure Boost Light Mount",
    catalog_section: "main",
    category: "Rack ",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/exposure-boost-light-mount/",
  },
  {
    id: "tailfin-642927",
    name: "Women's Logo T-Shirt - Black/Teal",
    catalog_section: "main",
    category: "T-Shirts",
    role: "non-bike-merchandise",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/hats-bottles-apparel/t-shirts/womens-logo-t-shirt-black-teal/",
  },
  {
    id: "tailfin-642858",
    name: "Women's Logo T-Shirt - Black/White",
    catalog_section: "main",
    category: "T-Shirts",
    role: "non-bike-merchandise",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/hats-bottles-apparel/t-shirts/womens-logo-t-shirt-black-white/",
  },
  {
    id: "tailfin-642818",
    name: "Mens Logo T-Shirt - Black/Teal",
    catalog_section: "main",
    category: "T-Shirts",
    role: "non-bike-merchandise",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/hats-bottles-apparel/t-shirts/mens-logo-t-shirt-black-teal/",
  },
  {
    id: "tailfin-642817",
    name: "Mens Logo T-Shirt - Black/White",
    catalog_section: "main",
    category: "T-Shirts",
    role: "non-bike-merchandise",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/hats-bottles-apparel/t-shirts/mens-logo-t-shirt-black-white/",
  },
  {
    id: "tailfin-675800",
    name: "Bottle Dropper",
    catalog_section: "main",
    category: "Accessories",
    role: "bike-component",
    mount_zone: "bottle-mount",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/product/accessories/bottle-dropper/",
  },
  {
    id: "tailfin-670495",
    name: "Packing Cubes",
    catalog_section: "main",
    category: "Packing Cubes",
    role: "off-bike-accessory",
    mount_zone: "accessory",
    variants: [
      { label: "6.5L", capacity_l: 6.5, weight_g: 65.8, dimensions_mm: null },
      { label: "3.5L", capacity_l: 3.5, weight_g: 41, dimensions_mm: null },
      { label: "2.5L", capacity_l: 2.5, weight_g: 46.1, dimensions_mm: null },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/packing-cubes/packing-cubes/",
  },
  {
    id: "tailfin-652018",
    name: "X35 E-Bike Adaptor Fast-Release Set",
    catalog_section: "main",
    category: "Rack ",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/x35-e-bike-adaptor-fast-release-set/",
  },
  {
    id: "tailfin-643500",
    name: "Logo Bottle - Black/Teal",
    catalog_section: "main",
    category: "Bottles",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/hats-bottles-apparel/bottles/logo-bottle-black-teal/",
  },
  {
    id: "tailfin-643499",
    name: "Logo Bottle - Black",
    catalog_section: "main",
    category: "Bottles",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/hats-bottles-apparel/bottles/tailfin-bottle-black/",
  },
  {
    id: "tailfin-643496",
    name: "Logo Bottle - Smoke",
    catalog_section: "main",
    category: "Bottles",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/hats-bottles-apparel/bottles/logo-bottle-smoke/",
  },
  {
    id: "tailfin-126220",
    name: "Cargo Straps",
    catalog_section: "main",
    category: "Cargo Straps",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "40cm",
        capacity_l: null,
        weight_g: 30,
        dimensions_mm: { length: 400, width: 20, thickness: 2.5 },
      },
      {
        label: "50cm",
        capacity_l: null,
        weight_g: 35,
        dimensions_mm: { length: 500, width: 20, thickness: 2.5 },
      },
      {
        label: "65cm",
        capacity_l: null,
        weight_g: 42,
        dimensions_mm: { length: 650, width: 20, thickness: 2.5 },
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/cargo-cage-system/cargo-straps/cargo-straps/",
  },
  {
    id: "tailfin-789125",
    name: "Cateye Wearable X Clip On Light",
    catalog_section: "main",
    category: "Accessories",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/product/accessories/cateye-light/",
  },
  {
    id: "tailfin-24700",
    name: "Light Mount (Fixed)",
    catalog_section: "main",
    category: "Rack Bag Accessories",
    role: "bike-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/trunk-bag-fixed-light-mount/",
  },
  {
    id: "tailfin-989106",
    name: "Pannier Shoulder Strap",
    catalog_section: "main",
    category: "Rack Bag Accessories",
    role: "off-bike-accessory",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-bag-accessories/pannier-shoulder-strap/",
  },
  {
    id: "tailfin-992191",
    name: "Pannier Laptop Holsters",
    catalog_section: "main",
    category: "Rack Bag Accessories",
    role: "off-bike-accessory",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-bag-accessories/pannier-laptop-holsters/",
  },
  {
    id: "tailfin-1032164",
    name: "Seat Post Connector",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/seat-post-connector-2/",
  },
  {
    id: "tailfin-917654",
    name: "Removable SpeedPack Connector Kit",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/speedpack-removable-connector/",
  },
  {
    id: "tailfin-916390",
    name: "Fixed SpeedPack Connector Parts",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/speedpack-fixed-connector-parts/",
  },
  {
    id: "tailfin-564",
    name: "12mm Thru Axle",
    catalog_section: "spares",
    category: "Axles",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/product/axles/12mm-thru-axle/",
  },
  {
    id: "tailfin-1027496",
    name: "Universal Thru Axle Non Drive Side",
    catalog_section: "spares",
    category: "Axle Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/axle-spares/universal-thru-axle-non-drive-side/",
  },
  {
    id: "tailfin-855567",
    name: "Bar Cage Barrel Nuts and Screws",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-cage-barrel-nut-screws/",
  },
  {
    id: "tailfin-855555",
    name: "Spare Bar Cage",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/spare-bar-cage/",
  },
  {
    id: "tailfin-836241",
    name: "SRAM Universal Derailleur Hanger (UDH)",
    catalog_section: "spares",
    category: "Axle Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/axle-spares/sram-udh/",
  },
  {
    id: "tailfin-894177",
    name: "SpeedPack Top Bag + Fixed Connector Kit",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/speedpack-fixed-system/",
  },
  {
    id: "tailfin-972191",
    name: "Fixed CargoPack Connector Parts v2",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/cargopack-fixed-connector-v2/",
  },
  {
    id: "tailfin-734880",
    name: "Tailfin Washers",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/tailfin-washers/",
  },
  {
    id: "tailfin-1047449",
    name: "T-Hook Straps",
    catalog_section: "spares",
    category: "Cargo Cage System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/cargo-cage-system-spares/t-hook-straps/",
  },
  {
    id: "tailfin-1032167",
    name: "Long Seat Post Strap",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/long-seat-post-strap-2/",
  },
  {
    id: "tailfin-1032170",
    name: "Journey Rack Fit Link Connectors",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/journey-rack-fit-link-spares/",
  },
  {
    id: "tailfin-730412",
    name: "Buckle Replacement Kits",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/buckle-replacement-kits/",
  },
  {
    id: "tailfin-20092",
    name: "Frame Mount Adaptor Set",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/frame-mount-adaptor-set/",
  },
  {
    id: "tailfin-16404",
    name: "Extended Seat Post Connector V1",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/extended-seat-post-connector/",
  },
  {
    id: "tailfin-710818",
    name: "Large MTB Bar Bag Roll (Bag Only)",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/mtb-bar-bag-roll-large/",
  },
  {
    id: "tailfin-710817",
    name: "Small MTB Bar Bag Roll (Bag Only)",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/mtb-bar-bag-roll/",
  },
  {
    id: "tailfin-710832",
    name: "Bar Bag Mounting Kit",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-bag-mounting-kit/",
  },
  {
    id: "tailfin-972190",
    name: "Removable CargoPack Connector Parts v2",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/cargopack-removable-connector/",
  },
  {
    id: "tailfin-750325",
    name: "Rear Top Tube Seat Post Strap",
    catalog_section: "spares",
    category: "Top Tube Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/seat-post-strap/",
  },
  {
    id: "tailfin-710830",
    name: "Large Dropbar Bar Bag Roll (Bag Only)",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/dropbar-bar-bag-roll/",
  },
  {
    id: "tailfin-710820",
    name: "Small Dropbar Bar Bag Roll (Bag Only)",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/dropbar-bar-bag-roll-small/",
  },
  {
    id: "tailfin-675876",
    name: "Mini Pannier / Fork Pack Conversion Kit",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/pannier-rack-top-bags/rear-pannier-bags/mini-pannier-fork-pack-conversion-kit/",
  },
  {
    id: "tailfin-750317",
    name: "Rear Top Tube V-Mount Cover",
    catalog_section: "spares",
    category: "Top Tube Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/rear-top-tube-v-mount-cover/",
  },
  {
    id: "tailfin-661862",
    name: "Frame Bag V-Mount",
    catalog_section: "spares",
    category: "Frame Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/frame-bag-spares/frame-bag-v-mount/",
  },
  {
    id: "tailfin-661776",
    name: "Cargo Cage Screw Set",
    catalog_section: "spares",
    category: "Cargo Cage System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/cage-screw-set/",
  },
  {
    id: "tailfin-988525",
    name: "CargoPack Fixed Connector - Front",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/fixed-connector-front/",
  },
  {
    id: "tailfin-661740",
    name: "Fork Pack Kit",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/fork-pack-kit/",
  },
  {
    id: "tailfin-734868",
    name: "Top Tube Strap Keeper - Pack of 4",
    catalog_section: "spares",
    category: "Top Tube Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/top-tube-strap-keeper-pack-of-4/",
  },
  {
    id: "tailfin-661731",
    name: "Fork Pack Mount",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/fork-pack-mount/",
  },
  {
    id: "tailfin-664853",
    name: "UDH Adaptor Set",
    catalog_section: "spares",
    category: "Axle Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/axle-spares/sram-udh-transmission-adaptor/",
  },
  {
    id: "tailfin-661863",
    name: "Frame Bag Long Strap",
    catalog_section: "spares",
    category: "Frame Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/frame-bag-spares/frame-bag-strap/",
  },
  {
    id: "tailfin-661861",
    name: "Pannier Lower Hook",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/16l-pannier-lower-hook/",
  },
  {
    id: "tailfin-652831",
    name: "Top Tube Pack V-Mount",
    catalog_section: "spares",
    category: "Top Tube Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/top-tube-v-mount/",
  },
  {
    id: "tailfin-661795",
    name: "Top Tube Pack Insert",
    catalog_section: "spares",
    category: "Top Tube Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/top-tube-pack-insert-spare/",
  },
  {
    id: "tailfin-988521",
    name: "Removable Connector - Front",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/removable-connector-front/",
  },
  {
    id: "tailfin-733559",
    name: "Bar Bag Spacers 31.8mm",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-bag-spacers-31-8mm/",
  },
  {
    id: "tailfin-733554",
    name: "Bar Bag Strap Keeper",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-bag-strap-keeper/",
  },
  {
    id: "tailfin-994176",
    name: "Thru Axle Spacers V2",
    catalog_section: "spares",
    category: "Axle Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/axle-spares/thru-axle-spacers-v2/",
  },
  {
    id: "tailfin-733562",
    name: "Bar Bag Pocket Hook",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-bag-pocket-hook/",
  },
  {
    id: "tailfin-733557",
    name: "Bar Bag X-Clamp Inserts",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-bag-x-clamp-inserts/",
  },
  {
    id: "tailfin-653454",
    name: "1.75mm Locking Nut",
    catalog_section: "spares",
    category: "Axle Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/axle-spares/1-75mm-locking-nut/",
  },
  {
    id: "tailfin-653447",
    name: "1.5mm Locking Nut",
    catalog_section: "spares",
    category: "Axle Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/axle-spares/1-5mm-locking-nut/",
  },
  {
    id: "tailfin-652830",
    name: "Top Tube Pack Long Strap",
    catalog_section: "spares",
    category: "Top Tube Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/toptube-long-strap/",
  },
  {
    id: "tailfin-762364",
    name: "DownTube Pack V-Mount",
    catalog_section: "spares",
    category: "Frame Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/frame-bag-spares/downtube-pack-v-mount/",
  },
  {
    id: "tailfin-652823",
    name: "Top Tube Pack Short Strap",
    catalog_section: "spares",
    category: "Top Tube Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/toptube-short-strap/",
  },
  {
    id: "tailfin-652020",
    name: "Mini Pannier Lower Parts",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/mini-pannier-lower-parts/",
  },
  {
    id: "tailfin-855553",
    name: "Bar Cage Single Clamp",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-cage-single-clamp/",
  },
  {
    id: "tailfin-733417",
    name: "Carbon Arch Mini Bumper",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/carbon-arch-mini-bumper/",
  },
  {
    id: "tailfin-652789",
    name: "LOOK Axle Adaptor",
    catalog_section: "spares",
    category: "Axles",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/axle-spares/look-axle-adaptor/",
  },
  {
    id: "tailfin-652726",
    name: "Hex Reducer",
    catalog_section: "spares",
    category: "Axle Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/axle-spares/hex-reducer/",
  },
  {
    id: "tailfin-652723",
    name: "AP Repair Patch",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/ap-repair-patch/",
  },
  {
    id: "tailfin-652015",
    name: "X35 E-bike Adaptors",
    catalog_section: "spares",
    category: "Axle Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/axle-spares/x35-e-bike-adaptors/",
  },
  {
    id: "tailfin-141887",
    name: "Third Party Rack Inserts",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/third-party-rack-inserts/",
  },
  {
    id: "tailfin-141836",
    name: "Cargo Strap Keeper - Pack of 4",
    catalog_section: "spares",
    category: "Top Tube Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/cargo-strap-keeper/",
  },
  {
    id: "tailfin-141832",
    name: "SFM Rebuild Kit",
    catalog_section: "spares",
    category: "Cargo Cage System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/cargo-cage-system-spares/sfm-rebuild-kit/",
  },
  {
    id: "tailfin-130755",
    name: "V-Mount Strap - 30 x 20cm",
    catalog_section: "spares",
    category: "Top Tube Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/frame-bag-spares/v-mount-straps/?wccps_c0=130755&wccpm0=1654781467&wccpl=7",
  },
  {
    id: "tailfin-793582",
    name: "Rear Top Tube Pack Insert",
    catalog_section: "spares",
    category: "Top Tube Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/rear-top-tube-pack-insert/",
  },
  {
    id: "tailfin-141677",
    name: "AP Stacking Straps",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/ap-stacking-straps/",
  },
  {
    id: "tailfin-129215",
    name: "Carbon Arch Bumpers",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/carbon-arch-bumpers/",
  },
  {
    id: "tailfin-138815",
    name: "Sl/UD 22L Pannier Internal Frame",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/22lframe/",
  },
  {
    id: "tailfin-137471",
    name: "AP Front Cover",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/ap-front-cover/",
  },
  {
    id: "tailfin-130754",
    name: "V-Mount Strap - 18.5 x 20cm",
    catalog_section: "spares",
    category: "Top Tube Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/frame-bag-spares/v-mount-straps/?wccps_c0=130754&wccpm0=1654781467&wccpl=7",
  },
  {
    id: "tailfin-129657",
    name: "Rebuild Kit for Rack & AeroPack",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/rebuild-kit-for-rack-and-aeropack-setups/",
  },
  {
    id: "tailfin-129619",
    name: "Universal Thru Axle Driveside Spare",
    catalog_section: "spares",
    category: "Axle Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/axle-spares/universal-thru-axle-driveside-spares/",
  },
  {
    id: "tailfin-809537",
    name: "AP Internal Frame",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/ap-internal-frame/",
  },
  {
    id: "tailfin-129212",
    name: "Alloy Arch Bumpers",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/alloy-arch-bumpers/",
  },
  {
    id: "tailfin-56062",
    name: "Carbon Top Stay",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/carbon-top-stay/",
  },
  {
    id: "tailfin-48955",
    name: "SL/UD 22L Pannier Lower Spare Parts",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/22l-pannier-lower-parts/",
  },
  {
    id: "tailfin-48964",
    name: "Long Seat Clamp Strap v1",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/long-seat-clamp-strap/",
  },
  {
    id: "tailfin-48947",
    name: "Pannier Upper Parts",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/pannier-upper-parts/",
  },
  {
    id: "tailfin-48957",
    name: "SL/UD 22L Pannier Inner Sleeve",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/pannier-inner-sleeve/",
  },
  {
    id: "tailfin-48956",
    name: "Security Torx Set",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/security-torx-set/",
  },
  {
    id: "tailfin-48954",
    name: "Direct Frame Mount Set",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/direct-frame-mount-set/",
  },
  {
    id: "tailfin-48952",
    name: "Cargo Cage Load Chip",
    catalog_section: "spares",
    category: "Cargo Cage System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/cargo-cage-system-spares/cargo-cage-load-chip/",
  },
  {
    id: "tailfin-33032",
    name: "Salsa Dropout Domed Nut",
    catalog_section: "spares",
    category: "Axles",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/axles/salsa-dropout-domed-nut/",
  },
  {
    id: "tailfin-33026",
    name: "Fast-Release Dropout Bushings",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/fast-release-dropout-bushings/",
  },
  {
    id: "tailfin-16145",
    name: "1.0mm Locking Nut",
    catalog_section: "spares",
    category: "Axle Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/axle-spares/1-0mm-locking-nut/",
  },
  {
    id: "tailfin-24733",
    name: "R.A.T Adaptor",
    catalog_section: "spares",
    category: "Axles",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url: "https://www.tailfin.cc/ca/product/axles/r-a-t-adaptor/",
  },
  {
    id: "tailfin-827",
    name: "Fast Release Dropouts",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/quick-release-dropouts/",
  },
  {
    id: "tailfin-656",
    name: "Removable CargoPack Connector Parts v1",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/ap-trunk-connector-parts/",
  },
  {
    id: "tailfin-653",
    name: "Fixed CargoPack Connector Parts v1",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/aeropack-connector-parts/",
  },
  {
    id: "tailfin-642",
    name: "Spare Alloy Arch (without mounts)",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/alloy-arch/",
  },
  {
    id: "tailfin-641",
    name: "Spare Carbon Arch (without mounts)",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/carbon-arch/",
  },
  {
    id: "tailfin-591",
    name: "Spare Alloy Arch (with mounts)",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/alloy-arch/",
  },
  {
    id: "tailfin-446",
    name: "Spare Carbon Arch (with mounts)",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/carbon-arch/",
  },
  {
    id: "tailfin-710834",
    name: "Bar Bag Hardware",
    catalog_section: "spares",
    category: "Bar System Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-bag-hardware/",
  },
  {
    id: "tailfin-734886",
    name: "Top Tube Flip Buckle",
    catalog_section: "spares",
    category: "Top Tube Bag Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/top-tube-flip-buckle/",
  },
  {
    id: "tailfin-730717",
    name: "Pearson Axle Adaptor",
    catalog_section: "spares",
    category: "Axle Spares",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/axle-spares/pearson-axle-adaptor/",
  },
  {
    id: "tailfin-141888",
    name: "Standard Pannier Inserts",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/standard-pannier-inserts/",
  },
  {
    id: "tailfin-676061",
    name: "Fork Pack Lower Hook",
    catalog_section: "spares",
    category: "Pannier ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/fork-pack-hook/",
  },
  {
    id: "tailfin-43567",
    name: "Alloy Arch",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/alloy-arch/",
  },
  {
    id: "tailfin-43576",
    name: "Carbon Arch",
    catalog_section: "spares",
    category: "Rack ",
    role: "spare-component",
    mount_zone: "accessory",
    variants: [
      {
        label: "Standard / options not yet normalized",
        capacity_l: null,
        weight_g: null,
        dimensions_mm: null,
      },
    ],
    source_url:
      "https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/carbon-arch/",
  },
];

export interface TailfinCatalogItem extends BagItem {
  sourceProductId: string;
  sourceVariantLabel: string;
  catalogSection: "main" | "spares";
  referenceOnly: boolean;
  sourceDimensionsMm: Record<string, number> | null;
  pocketCapacityLiters: number | null;
  minimumCapacityLiters: number | null;
}
interface Placement {
  category: BagCategory;
  productKind: NonNullable<BagItem["productKind"]>;
  visualKind: NonNullable<BagItem["visualKind"]>;
  sockets: string[];
  requires?: string[];
  provides?: string[];
  excludes?: string[];
}
const referencePlacement = (spare: boolean): Placement => ({
  category: spare ? "spare" : "accessory",
  productKind: spare ? "spare" : "accessory",
  visualKind: spare ? "spare" : "accessory",
  sockets: [],
});

// Replacement rolls include bag hardware, but require the separate bike-side mounting kit.
// Do not copy sibling system weights or capacity into unnormalized spare specifications.
const BAR_ROLL_REPLACEMENTS: Record<string, { handlebarType: "flat" | "drop"; diameter: number; width: number }> = {
  "tailfin-710818": { handlebarType: "flat", diameter: 180, width: 480 },
  "tailfin-710817": { handlebarType: "flat", diameter: 160, width: 430 },
  "tailfin-710830": { handlebarType: "drop", diameter: 180, width: 380 },
  "tailfin-710820": { handlebarType: "drop", diameter: 160, width: 320 },
};

function placement(p: SourceProduct, v: SourceVariant): Placement {
  const base = referencePlacement(p.catalog_section === "spares");
  if (["tailfin-48947", "tailfin-652020"].includes(p.id))
    return {category:"mount",productKind:"spare",visualKind:"mount",sockets:p.id==="tailfin-48947" ? ["rearPannierUpperLeft","rearPannierUpperRight"] : ["rearPannierLowerLeft","rearPannierLowerRight"],
      requires:["pannier-mounts"],provides:[p.id==="tailfin-48947" ? "rear-pannier-upper" : "rear-mini-lower"], excludes:["third-party-pannier-adapters"]};
  if (["tailfin-1032164", "tailfin-1032167", "tailfin-48964", "tailfin-56062"].includes(p.id))
    return {category:"mount",productKind:"spare",visualKind:"mount",
      sockets:[p.id === "tailfin-1032164" ? "rearSeatConnector" : p.id === "tailfin-56062" ? "rearTopStay" : "rearSeatStrap"],
      requires:[p.id === "tailfin-1032164" ? "rear-rack" : p.id === "tailfin-1032167" ? "journey-rack" : p.id === "tailfin-56062" ? "carbon-rack-top-stay" : "legacy-rear-seat-strap"]};
  if (p.id === "tailfin-1029289")
    return {
      category: "accessory", productKind: "accessory", visualKind: "fender",
      sockets: ["journeyMudguard"], requires: ["journey-rack"],
    };
  if (["tailfin-1027471", "tailfin-1027465", "tailfin-1027459", "tailfin-1027462"].includes(p.id))
    return {
      category: "mount", productKind: "mount", visualKind: "mount",
      sockets: ["rearLightMount"], requires: ["tailfin-rear-light-interface"],
    };
  if (p.id === "tailfin-24700")
    return {
      category: "mount", productKind: "mount", visualKind: "mount",
      sockets: ["rearLightMount"], requires: ["tailfin-fixed-bag-light-interface"],
    };
  if (p.id === "tailfin-789125")
    return {
      category: "accessory", productKind: "accessory", visualKind: "accessory",
      sockets: ["rearLightMount"], requires: ["tailfin-clip-light-interface"],
    };
  if (p.id === "tailfin-126220")
    return {
      category: "mount", productKind: "mount", visualKind: "strap",
      sockets: ["cargoStrapUpperLeft", "cargoStrapLowerLeft", "cargoStrapUpperRight", "cargoStrapLowerRight"],
      requires: ["cargo-cage"],
      provides: ["cargo-strap-upper", "cargo-strap-lower"],
    };
  if (["tailfin-661740", "tailfin-661731", "tailfin-675876"].includes(p.id))
    return { category:"mount", productKind:"spare", visualKind:"mount", sockets:["forkPackHardwareLeft","forkPackHardwareRight"],
      requires: p.id === "tailfin-675876" ? ["fork-mount"] : ["fork-pack-host"],
      provides: p.id === "tailfin-675876" ? ["mini-pannier-conversion"] : [] };
  if (p.id === "tailfin-676061")
    return { category:"mount", productKind:"spare", visualKind:"mount", sockets:["forkPackHookLeft","forkPackHookRight"], requires:["fork-pack-host"] };
  if (["tailfin-643500", "tailfin-643499", "tailfin-643496"].includes(p.id))
    return { category:"accessory", productKind:"accessory", visualKind:"accessory", sockets:["bottleDown","bottleSeat"] };
  if (["tailfin-642", "tailfin-641", "tailfin-591", "tailfin-446", "tailfin-43567", "tailfin-43576"].includes(p.id))
    return { category:"mount", productKind:"spare", visualKind:"mount", sockets:["rearArchReplacement"],
      requires: [/Carbon/.test(p.name) ? "tailfin-carbon-arch-host" : "tailfin-alloy-arch-host"] };
  if (p.id === "tailfin-20115")
    return { category:"mount", productKind:"mount", visualKind:"mount", sockets:["thirdPartyPannierAdapters"],
      requires:["pannier-mounts"], provides:["third-party-pannier-adapters"], excludes:["tailfin-pannier"] };
  if (["tailfin-855555", "tailfin-855553"].includes(p.id))
    return {
      category: "mount", productKind: "spare", visualKind: "mount",
      sockets: p.id === "tailfin-855555" ? ["barCageReplacement"] : ["barCageClampLeft", "barCageClampRight"],
      requires: ["bar-cage-accessory"],
    };
  if (["tailfin-1012933", "tailfin-1012929"].includes(p.id))
    return {
      category: "mount", productKind: "mount", visualKind: "mount",
      sockets: ["barCageAccessory"], requires: ["bar-cage-accessory"],
    };
  if (p.id === "tailfin-48952")
    return { category: "mount", productKind: "mount", visualKind: "mount",
      sockets: ["cargoFootLeft", "cargoFootRight"], requires: ["cargo-cage-load-chip-host"] };
  if (["tailfin-959100", "tailfin-675800"].includes(p.id))
    return { category: "mount", productKind: "mount", visualKind: "mount",
      sockets: ["bottleMountDown", "bottleMountSeat"] };
  if (BAR_ROLL_REPLACEMENTS[p.id])
    return {
      category: "handlebar_roll", productKind: "bag", visualKind: "bar_roll",
      sockets: ["handlebar"], requires: ["bar-bag-mount"],
    };
  if (p.id === "tailfin-710832")
    return {
      category: "mount", productKind: "mount", visualKind: "mount",
      sockets: ["barMount"], provides: ["bar-bag-mount"],
    };

  if (p.id === "tailfin-894177")
    return {
      category: "seat_pack", productKind: "bag", visualKind: "trunk",
      sockets: ["rackTop"], requires: ["rack-top"],
      provides: ["tailfin-rear-light-interface", "tailfin-fixed-bag-light-interface"],
    };
  // Specific complete hardware kits are selectable even though their source section is Spares.
  if (p.id === "tailfin-34167")
    return {
      category: "mount",
      productKind: "mount",
      visualKind: "mount",
      sockets: ["rearAxleHardware"],
      provides: ["tailfin-axle"],
    };
  if (p.id === "tailfin-664853")
    return {
      category: "mount",
      productKind: "mount",
      visualKind: "mount",
      sockets: ["rearUdhHardware"],
      provides: ["udh-adapter"],
    };
  if (p.mount_zone === "rear-system" || p.mount_zone === "rear-rack") {
    // Direct mounts need confirmed frame eyelets; neither Santa Cruz model has that confirmation.
    const sockets = /Direct Mount/i.test(v.label) ? [] : ["rearRack"];
    const fixed = p.mount_zone === "rear-system";
    const panniers =
      /^With pannier mounts$/i.test(v.label) ||
      /\/ with pannier mounts$/i.test(v.label);
    return {
      category: "rack",
      productKind: "rack",
      visualKind: fixed ? "aeropack" : "rack",
      sockets,
      requires: ["tailfin-axle", "udh-adapter"],
      provides: [
        "rear-rack",
        ...(p.id === "tailfin-895075" ? ["carbon-rack-top-stay"] : []),
        ...(p.id === "tailfin-895075" || p.mount_zone === "rear-system" ? ["legacy-rear-seat-strap"] : []),
        ...(p.id === "tailfin-895075" || (fixed && /Carbon/.test(v.label)) ? ["tailfin-carbon-arch-host"] : fixed && /Alloy/.test(v.label) ? ["tailfin-alloy-arch-host"] : []),
        ...(fixed ? [] : ["rack-top"]),
        ...(panniers ? ["pannier-mounts"] : []),
        ...(p.id === "tailfin-1008020"
          ? ["journey-rack", "tailfin-rear-light-interface"]
          : []),
        ...(p.mount_zone === "rear-system"
          ? [
              "tailfin-rear-light-interface",
              "tailfin-fixed-bag-light-interface",
              ...(p.id === "tailfin-913333" ? ["tailfin-clip-light-interface"] : []),
            ]
          : []),
      ],
    };
  }
  if (p.id === "tailfin-723748")
    return {
      category: "handlebar_roll",
      productKind: "bag",
      visualKind: "bar_roll",
      sockets: ["handlebar"],
      excludes: ["bar-cage", "bar-bag-mount"],
    };
  if (p.id === "tailfin-825745") {
    if (v.label === "Cage only")
      return {
        category: "cargo_cage",
        productKind: "cage",
        visualKind: "cage",
        sockets: ["barMount"],
        provides: ["bar-cage", "bar-cage-accessory"],
      };
    return {
      category: "handlebar_roll",
      productKind: "bag",
      visualKind: "bar_roll",
      sockets: ["handlebar"],
      excludes: ["bar-cage", "bar-bag-mount"],
      provides: ["bar-cage-accessory"],
    };
  }
  if (p.id === "tailfin-851925")
    return {
      category: "handlebar_roll",
      productKind: "bag",
      visualKind: "bar_roll",
      sockets: ["handlebar"],
      requires: ["bar-cage"],
    };
  if (p.mount_zone === "rack-top")
    return {
      category: "seat_pack",
      productKind: "bag",
      visualKind: "trunk",
      sockets: ["rackTop"],
      requires: ["rack-top"],
      ...(p.id === "tailfin-670"
        ? { provides: ["tailfin-rear-light-interface", "tailfin-fixed-bag-light-interface", "tailfin-clip-light-interface"] }
        : {}),
    };
  if (p.mount_zone === "rear-side")
    return {
      category: "pannier",
      productKind: "bag",
      visualKind: "pannier",
      sockets: p.id === "tailfin-972100" ? ["pannierLeft", "pannierRight", "forkLeft_0", "forkRight_0"] : ["pannierLeft", "pannierRight"],
      requires: ["pannier-mounts"],
      provides: ["tailfin-pannier"],
    };
  if (p.mount_zone === "frame")
    return {
      category: "frame_half",
      productKind: "bag",
      visualKind: "half_frame",
      sockets: ["frameTriangle"],
    };
  if (p.mount_zone === "top-tube" || p.mount_zone === "rear-top-tube")
    return {
      category: "top_tube",
      productKind: "bag",
      visualKind: "top_tube",
      sockets: [
        p.mount_zone === "rear-top-tube" ? "topTubeRear" : "topTubeFront",
      ],
    };
  if (p.id === "tailfin-32010" || p.id === "tailfin-46283")
    return {
      category: "cargo_cage",
      productKind: "cage",
      visualKind: "cage",
      sockets: ["cageLeft", "cageRight"],
      requires: ["fork-mount"],
      provides: ["cargo-cage", ...(p.id === "tailfin-32010" ? ["cargo-cage-load-chip-host"] : [])],
    };
  if (p.id === "tailfin-56316")
    return {
      category: "fork_cage_bag",
      productKind: "bag",
      visualKind: "fork_pack",
      sockets: ["forkLeft_0", "forkRight_0"],
      requires: ["cargo-cage", "cargo-strap-upper", "cargo-strap-lower"],
    };
  if (p.id === "tailfin-655674")
    return {
      category: "fork_cage_bag",
      productKind: "bag",
      visualKind: "fork_pack",
      sockets: ["forkLeft_0", "forkRight_0", "pannierLeft", "pannierRight"],
      requires: ["fork-mount"],
      provides: ["fork-pack-host", "tailfin-pannier"],
    };
  if (p.id === "tailfin-129268")
    return {
      category: "fork_cage_bag",
      productKind: "bag",
      visualKind: "fork_pack",
      sockets: ["downtubeUnderside"],
    };
  if (p.id === "tailfin-42733")
    return {
      category: "mount",
      productKind: "mount",
      visualKind: "mount",
      sockets: ["forkMountLeft", "forkMountRight"],
      provides: ["fork-mount"],
    };
  return base;
}

/** Renderer backlog classification, not manufacturer compatibility or dimensional evidence.
 * Visible replacement parts stay pending even when their parent system already has a preview.
 * Internal storage inserts and service-only parts are nonvisual; retail/off-bike products are separate.
 */
const NONVISUAL_SPARES = new Set([
  "855567", "734880", "661776", "661795", "653454", "653447", "652726", "732058",
  "652723", "141832", "793582", "138815", "129657", "809537", "48957",
  "48956", "16145", "710834",
].map((id) => `tailfin-${id}`));
const UNSUPPORTED_INTERFACES = new Map([
  ["361", "QR axle interface is not supported by the selected thru-axle Santa Cruz builds."],
  ["652018", "X35 e-bike interface is outside these Santa Cruz builds."],
  ["652015", "X35 e-bike interface is outside these Santa Cruz builds."],
  ["652789", "LOOK-specific axle interface is not verified for these Santa Cruz builds."],
  ["24733", "R.A.T-specific axle interface is not verified for these Santa Cruz builds."],
  ["730717", "Pearson-specific axle interface is not verified for these Santa Cruz builds."],
  ["33032", "Salsa-specific dropout interface is not verified for these Santa Cruz builds."],
  ["20092", "Required frame-eyelet interface is not confirmed for these Santa Cruz builds."],
  ["48954", "Required frame-eyelet interface is not confirmed for these Santa Cruz builds."],
].map(([id, reason]) => [`tailfin-${id}`, reason]));
function previewCoverage(p: SourceProduct, v: SourceVariant, place: Placement) {
  const result = (previewStatus: NonNullable<BagItem["previewStatus"]>, previewStatusLabel: string, previewStatusReason: string) =>
    ({ previewStatus, previewStatusLabel, previewStatusReason });
  if (place.sockets.length) return result("mountable", "Illustrative preview", "Placement is available; model-specific physical fit remains unverified.");
  if (/Direct Mount/i.test(v.label)) return result("unsupported-fit", "Unsupported fit", "Direct-mount frame eyelets are not confirmed for these Santa Cruz builds.");
  const unsupported = UNSUPPORTED_INTERFACES.get(p.id);
  if (unsupported) return result("unsupported-fit", "Unsupported fit", unsupported);
  if (p.role === "non-bike-merchandise" || p.role === "off-bike-accessory")
    return result("off-bike", "Off-bike item", "Merchandise or an accessory used away from the mounted rig; no exterior bike preview is planned.");
  if (NONVISUAL_SPARES.has(p.id)) return result("nonvisual-spare", p.id === "tailfin-732058" ? "Internal storage insert" : "Internal / service spare", p.id === "tailfin-732058" ? "Internal divider, pockets and tool loops are storage inserts, not a visible exterior component." : "Internal structure, service kit or small fastener: no standalone exterior placement. This does not certify a replacement part's compatibility.");
  return result("implementation-pending", "Preview still to build", "Visible bike component: geometry, attachment and dependencies remain to be implemented. Unknown dimensions are not a reason to call this complete.");
}

// Illustrator envelopes, not product specifications. Scaling makes capacity variants visibly distinct
// while preserving the explicit absence of measured length/height/depth for clearance calculations.
function visualEnvelope(
  p: SourceProduct,
  v: SourceVariant,
  kind: Placement["visualKind"],
): NonNullable<BagItem["visualDimensionsMm"]> {
  const capacity = v.capacity_l ?? 0;
  const scale = (reference: number) =>
    Math.cbrt(Math.max(capacity, 0.2) / reference);
  const envelope = (
    length: number,
    height: number,
    depth: number,
    factor = 1,
  ) => ({
    length: Math.round(length * factor),
    height: Math.round(height * factor),
    depth: Math.round(depth * factor),
  });
  const d = v.dimensions_mm;
  if (p.id === "tailfin-126220") return envelope(140, 20, 130);
  if (["tailfin-643500", "tailfin-643499", "tailfin-643496"].includes(p.id)) return envelope(74,230,74);
  if (p.id === "tailfin-20115") return envelope(180,30,220);
  if (p.id === "tailfin-1012933") return envelope(60, 25, 35);
  if (p.id === "tailfin-1012929") return envelope(40, 30, 45);
  if (p.id === "tailfin-1029289") return envelope(400, 30, 65);
  if (["tailfin-1027471", "tailfin-1027465", "tailfin-1027459", "tailfin-1027462"].includes(p.id))
    return envelope(30, 45, 35);
  if (p.id === "tailfin-24700") return envelope(18, 25, 64);
  if (p.id === "tailfin-789125") return envelope(25, 65, 30);
  switch (kind) {
    case "aeropack":
      return envelope(450, p.name.startsWith("Speed") ? 570 : 620, 260);
    case "rack":
      return envelope(435, 430, 250);
    case "trunk":
      return envelope(
        435,
        p.name.startsWith("Speed") ? 150 : 240,
        d?.width_rear ?? 180,
      );
    case "half_frame":
      return envelope(400, 130, 70, scale(3));
    case "top_tube":
      return p.mount_zone === "rear-top-tube"
        ? envelope(160, 90, 65, scale(0.9))
        : envelope(
            p.name.startsWith("Long") ? 360 : 230,
            90,
            65,
            scale(p.name.startsWith("Long") ? 2.2 : 1.1),
          );
    case "bar_roll": {
      const replacement = BAR_ROLL_REPLACEMENTS[p.id];
      if (replacement) return envelope(replacement.diameter, replacement.diameter, replacement.width);
      // Bundles use the same illustrative packed envelope as their separate bags.
      if (p.id === "tailfin-825745") return capacity <= 8 ? envelope(135,135,450) : capacity <= 11 ? envelope(165,165,455) : envelope(180,180,470);
      const diameter =
        d?.diameter ?? (capacity <= 8 ? 135 : capacity <= 11 ? 165 : 180);
      const width =
        d?.length_min && d?.length_max
          ? (d.length_min + d.length_max) / 2
          : Math.max(320, (capacity * 1e6) / (Math.PI * (diameter / 2) ** 2));
      return envelope(diameter, diameter, width);
    }
    case "pannier":
      return envelope(250, 330, 160, scale(10));
    case "fork_pack":
      if (p.id === "tailfin-56316") return capacity <= 1.7 ? envelope(100,245,100) : capacity <= 3 ? envelope(125,290,120) : envelope(150,365,140);
      return envelope(140, 260, 130, scale(3));
    case "cage":
      return p.id === "tailfin-825745"
        ? envelope(130, 110, 220)
        : envelope(35, d?.length ?? 170, d?.width ?? 72);
    case "mount":
      if (p.id === "tailfin-48952") return envelope(30, 20, 55);
      if (p.id === "tailfin-959100") return envelope(28, 90, 35);
      if (p.id === "tailfin-675800") return envelope(5, 160, 22);
      if (p.id === "tailfin-42733") return envelope(63, 90, 48);
      if (p.id === "tailfin-710832") return envelope(80, 75, 115);
      return p.id === "tailfin-34167"
        ? envelope(18, 18, 180)
        : envelope(35, 45, 35);
    default:
      return envelope(60, 60, 30);
  }
}

function actualEnvelope(
  p: SourceProduct,
  v: SourceVariant,
  place: Placement,
): BagItem["dimensionsMm"] {
  const d = v.dimensions_mm;
  // Cargo Strap source dimensions describe the loose strap, not an installed loop.
  if (p.id === "tailfin-126220")
    return { length: null, height: null, depth: null };
  // Source rear-system dimensions describe the bag only, not the complete arch system envelope.
  if (!d || place.visualKind === "aeropack")
    return { length: null, height: null, depth: null };
  if (place.visualKind === "bar_roll")
    return {
      length: d.diameter ?? null,
      height: d.diameter ?? null,
      depth: null,
    }; // rolled lateral width is variable
  if (p.id === "tailfin-32010")
    return {
      length: d.depth ?? null,
      height: d.length ?? null,
      depth: d.width ?? null,
    };
  // Unrolled heights and tapered widths cannot establish a packed bag's bounding box.
  if (place.visualKind === "trunk")
    return { length: d.length ?? null, height: null, depth: null };
  return { length: d.length ?? null, height: null, depth: null };
}

function normalize(
  p: SourceProduct,
  v: SourceVariant,
  index: number,
): TailfinCatalogItem {
  const place = placement(p, v);
  const coverage = previewCoverage(p, v, place);
  const dimensions = actualEnvelope(p, v, place);
  const envelope = visualEnvelope(p, v, place.visualKind);
  const unknownDimensions = Object.values(dimensions).some(
    (value) => value === null,
  );
  const combinedBarWeight =
    p.id === "tailfin-723748" &&
    v.weight_g !== null &&
    v.bar_clamp_weight_g !== undefined
      ? v.weight_g + v.bar_clamp_weight_g
      : p.id === "tailfin-675800" ? 25 : p.id === "tailfin-642" ? 370 : p.id === "tailfin-591" ? 471 : p.id === "tailfin-20115" ? 82.5 : v.weight_g;
  const notes = [
    ["tailfin-48947", "tailfin-652020", "tailfin-655674"].includes(p.id)
      ? "Rear Fork Pack conversion is conditional on compatible 5/10 L second-generation hardware: select Pannier Upper Parts and Mini Pannier Lower Parts on that side, representing separately sourced parts or the retained original clamp/hook arm/hook. The fork conversion kit alone does not restore them. Mini lower parts require the correct screw (Gen2 12 mm; Gen1 18 mm); included fastener contents and exact purchased revision must be checked. Upper part is listed for all panniers; mini lower part is only 5/10 L. Modified bag mass excludes unknown removed hardware; capacity/payload remain. Original illustrative geometry is not fit approval."
      : "",

    ["tailfin-1032164", "tailfin-1032167", "tailfin-48964", "tailfin-56062"].includes(p.id)
      ? "Replacement of included rear-system hardware, not an additional complete attachment. Seat Post Connector is listed for all rear systems; Long Seat Post Strap is the Journey-specific option, while v1 strap is listed as included with Carbon Rack/CargoPack/SpeedPack. Carbon Top Stay is only for Carbon Pannier Rack; two source length options require exact fit selection and this generic snapshot record does not select one. Its listed 93.2 g is not normalized because option-specific mass is unspecified. Source mass/dimensions remain unknown here; modified host is excluded from known mass because removed-part mass is unknown. Original estimated geometry attaches only to the fixed outer seatpost; no dropper or exact frame fit approval is implied."
      : "",

    ["tailfin-661740", "tailfin-661731", "tailfin-676061", "tailfin-675876"].includes(p.id)
      ? "Illustrative Fork Pack hardware; source mass and dimensions unknown. Mount and lower hook are replacement parts for 5/10 L Fork Packs. Complete kits overlap individual parts and cannot be stacked on the same side. The generic hardware kit's exact contents remain unspecified. Conversion kit includes fork mount, X-clamp, lower bumper/hook and fasteners; forward preview requires compatible second-generation 5/10 L Mini Panniers; 16 L bags are excluded. Reverse conversion requires the original retained Mini Pannier clamp, hook arm, lower hook and correct screws, or separately selected compatible upper/lower replacement parts. The generic kit snapshot does not verify a reverse-kit package. Modified bag mass is excluded because removed hardware mass is unknown. Exact fork approval remains unverified."
      : "",
    p.id === "tailfin-972100"
      ? "Fork-position preview is conditional on a compatible second-generation Mini Pannier and the same-side conversion kit. This does not establish the generation of an already-owned bag. Rear pannier placement remains the normal interface; 16 L panniers are not supported for this conversion."
      : "",

    ["tailfin-643500", "tailfin-643499", "tailfin-643496"].includes(p.id)
      ? "Original illustrative bottle with an unweighted reference cage, not included equipment. Bottle mass, water capacity and dimensions are unknown. Add carried water to payload manually; water capacity is not luggage capacity. Actual cage, frame boss and bottle fit remain unverified."
      : "",
    ["tailfin-642", "tailfin-641", "tailfin-591", "tailfin-446", "tailfin-43567", "tailfin-43576"].includes(p.id)
      ? "Replacement arch preview for the matching material rear-system family; Journey rack is excluded. Original estimated geometry, exact model fit and dimensions unverified. The modified host mass is excluded because removed component mass is unknown. Generic arch records share the same source family and have unspecified mount options; their preview cannot support panniers. Alloy-specific source mass: without mounts 370 g; with mounts 471 g."
      : "",
    p.id === "tailfin-20115"
      ? "Sold as a pair; official mass 82.5 g and rod diameter 10 mm. Illustrative rail length and attachment position unverified. Requires pannier mounts; T1 rack excluded. Third-party bag/inserts are not included, and QL3.1 compatibility is not established. This adapter occupies the conventional pannier interface and cannot be combined with modeled Tailfin panniers."
      : "",

    ["tailfin-855555", "tailfin-855553"].includes(p.id)
      ? "Replacement preview on an existing Bar Cage only. Original illustrative geometry replaces the corresponding cage or one clamp in the scene; included hardware, exact handing, dimensions and mass are unverified. Modified host mass is excluded from the known subtotal because the removed component mass is unknown."
      : "",

    p.id === "tailfin-126220"
      ? `Sold individually; a strap is not included with Cage Packs. Source strap size ${v.dimensions_mm?.length} × ${v.dimensions_mm?.width} × ${v.dimensions_mm?.thickness} mm and mass ${v.weight_g} g describe the loose strap only. The illustrated installed loop shape is unverified.`
      : "",
    p.id === "tailfin-56316"
      ? `Cargo Straps are not included. Official FAQ: https://www.tailfin.cc/product/cargo-cage-system/cage-packs/cage-packs/ recommends 40 cm for 1.7 L, 50 cm for 3 L and 5 L, and 65 cm for 5 L. Published ${v.weight_g} g pack mass excludes separate cargo straps. The 5 L pack includes side compression T-Hook straps, a different part.`
      : "",
    p.id === "tailfin-1012933"
      ? "Illustrative computer mount envelope only; source mass and dimensions are unknown. GPS/computer not included. Requires a Bar Cage, either standalone or included in a cage-and-bag bundle."
      : "",
    p.id === "tailfin-1012929"
      ? "Illustrative light mount envelope only; source mass and dimensions are unknown. Light not included. The 22 mm name is a nominal mount size, not the complete envelope. Requires a Bar Cage, either standalone or included in a cage-and-bag bundle."
      : "",
    p.id === "tailfin-732058"
      ? "Internal storage accessory pack: additional divider, two accessory pockets and two tool/pump loops. Source mass and dimensions are unknown; components are not modeled as exterior geometry."
      : "",
    p.id === "tailfin-1029289"
      ? "Illustrative mudguard envelope only; source mass and dimensions are unknown. Requires the Journey rack. The Journey rack is not recommended for full-suspension use."
      : "",
    ["tailfin-1027471", "tailfin-1027465", "tailfin-1027459", "tailfin-1027462"].includes(p.id)
      ? `Illustrative mount envelope only; source mass and dimensions are unknown. Light not included.${p.id === "tailfin-1027471" ? " Garmin RCT715 requires the Lever-lock adapter from Garmin’s Seat Rail Mount Kit; adapter mass and dimensions are unknown." : ""}`
      : "",
    p.id === "tailfin-24700"
      ? "Illustrative fixed light mount envelope only; source mass is unknown. Mounts to CargoPack or Fixed SpeedPack; light not included. 50 mm M5 slot spacing and 8.7 mm central wiring hole are source facts."
      : "",
    p.id === "tailfin-789125"
      ? "Illustrative light envelope only; source mass and dimensions are unknown. Includes detachable clip and rubber-strap bike mount; mounted-light fit remains unverified."
      : "",
    p.id === "tailfin-48952" ? "Optional removable L foot for Small/Large Cargo Cages, not Mini Cage. Source pages conflict: spare page 10 g, cage page 11 g; mass remains unknown. Foot envelope is illustrative." : "",
    p.id === "tailfin-675800" ? "Supplemental official product page checked 2026-10-02: adapter 25 g, 5 mm stack and up to ±45 mm cage adjustment. Preview uses 45 mm lower setting, not a required installation. Requires existing bottle bosses; cage and bottle excluded. Outer envelope and actual boss positions remain illustrative." : "",
    p.id === "tailfin-959100" ? "Frame-tube strap adapter only; never offered on forks, stays or carbon rack arches. Official page: approximately 22–90 mm tube diameter and 64 mm cage spacing; 2 straps support 1 kg, 3 straps 1.5 kg. Preview illustrates two straps. 19 g body mass excludes straps/screws, so complete mass remains unknown. Bottle and cage excluded; verify tube shape, location and instructions." : "",

    p.id === "tailfin-894177"
      ? "Top bag plus fixed connector upgrade kit; requires an existing supported rack. This is not a complete SpeedPack system and does not add a second arch. Source spare-kit mass and normalized capacity are unknown; fixed connector geometry is illustrative. Verify rack generation and conversion instructions."
      : "",
    BAR_ROLL_REPLACEMENTS[p.id]
      ? "Replacement bag includes bag-side hardware, not the separate bike-side Bar Bag Mounting Kit. Listed spare mass/capacity remain unknown; sibling complete-system specifications are not substituted. Rendered bag-size differences are illustration estimates."
      : "",
    p.id === "tailfin-710832"
      ? "Bike-side mounting kit for a separate replacement Bar Bag Roll. Do not add to a complete Bar Bag System: its clamp mass is already counted. Spare-kit mass is not normalized in the source."
      : "",
    "Exploratory placement; no model, size or loaded-clearance fit certification.",
    unknownDimensions
      ? "Complete packed dimensions unavailable; rendered envelope is an explicit illustration estimate."
      : "Axis mapping uses published component dimensions; attachment location remains illustrative.",
    place.sockets.length
      ? ""
      : `${coverage.previewStatusLabel}: ${coverage.previewStatusReason}`,
    p.mount_zone === "rear-system"
      ? "Fixed system mass includes bag and arch. Published unrolled bag dimensions do not describe the complete system. CargoPack was formerly AeroPack."
      : "",
    /Direct Mount/i.test(v.label)
      ? "Direct-mount frame eyelets are not confirmed for these Santa Cruz bikes."
      : "",
    p.id === "tailfin-723748"
      ? `Mass includes separately listed ${v.bar_clamp_weight_g} g bar clamp. Choose the variant matching the actual handlebar; verify full-compression tire clearance.`
      : "",
    p.id === "tailfin-825745"
      ? "Combined variants include cage and bag mass; cage-only and separate bag are an alternative, not extra required components."
      : "",
    p.id === "tailfin-32010"
      ? "Published cage mass excludes optional Load Chip; cage page lists 11 g while current spare page lists 10 g. Conflict remains unresolved."
      : "",
    p.id === "tailfin-655674"
      ? "Published Fork Pack mass includes its own pack mount. Approved fork attachment still required."
      : "",
    p.id === "tailfin-42733"
      ? "One set serves one fork leg. FOX 34 SL and rigid Stigmata carbon fork approval is unverified; listed exclusions include Rudy, Fox 32 Taper-Cast and certain Fox 34 models."
      : "",
    p.id === "tailfin-664853"
      ? "Verify exact derailleur, dropout, UDH/Transmission and model-year adapter requirements."
      : "",
    p.mount_zone === "frame"
      ? "Use actual-size template; verify shock sweep, bottles and Glovebox access."
      : "",
    p.name === "Carbon Pannier Rack"
      ? "Removable carbon-rack top-bag systems are not recommended for rough full-suspension riding."
      : "",
    v.pocket_capacity_l
      ? `Published extra pocket capacity ${v.pocket_capacity_l} L is separate and omitted from the main capacity total.`
      : "",
    v.min_capacity_l
      ? `Roll closure capacity varies from ${v.min_capacity_l} to ${v.capacity_l} L; displayed capacity is the published maximum.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    id: `${p.id}-v${index + 1}`,
    sourceProductId: p.id,
    sourceVariantLabel: v.label,
    catalogSection: p.catalog_section === "spares" ? "spares" : "main",
    referenceOnly: place.sockets.length === 0,
    ...coverage,
    brand: "Tailfin",
    name: `${p.name}${v.label === "Standard / options not yet normalized" ? "" : ` · ${v.label}`}`,
    category: place.category,
    productKind: place.productKind,
    visualKind: place.visualKind,
    handlebarType:
      p.id === "tailfin-723748"
        ? /^Flat bar/i.test(v.label)
          ? "flat"
          : "drop"
        : BAR_ROLL_REPLACEMENTS[p.id]?.handlebarType,
    volumeLiters: v.capacity_l,
    dryWeightGrams: combinedBarWeight,
    dimensionsMm: dimensions,
    sourceDimensionsMm: v.dimensions_mm,
    visualDimensionsMm: envelope,
    dimensionsStatus: unknownDimensions ? "unknown" : "verified",
    weightStatus: combinedBarWeight === null ? "unknown" : "verified",
    compatibleSockets: place.sockets,
    requires: place.requires,
    provides: place.provides,
    excludes: place.excludes,
    productUrl: p.source_url,
    specSourceUrl: p.source_url,
    priceUsd: null,
    colorHex: "#292d2b",
    fitStatus: "unverified",
    specNotes: notes,
    capacityOptions: p.variants
      .map((item) => item.capacity_l)
      .filter((capacity): capacity is number => capacity !== null),
    pocketCapacityLiters: v.pocket_capacity_l ?? null,
    minimumCapacityLiters: v.min_capacity_l ?? null,
  };
}

/** Every enumerated variant, including non-mountable reference components. */
export const TAILFIN_CATALOG: TailfinCatalogItem[] =
  TAILFIN_SOURCE_PRODUCTS.flatMap((product) =>
    product.variants.map((variant, index) =>
      normalize(product, variant, index),
    ),
  );
/** Main shop only; the name is retained for the app's existing catalog integration API. */
export const TAILFIN_BAGS = TAILFIN_CATALOG.filter(
  (item) => item.catalogSection === "main",
);
/** Includes the selectable UDH adapter; combine through TAILFIN_CATALOG to avoid duplicates. */
export const TAILFIN_SPARES = TAILFIN_CATALOG.filter(
  (item) => item.catalogSection === "spares",
);
export const TAILFIN_PREVIEW_COUNTS = TAILFIN_CATALOG.reduce((counts, item) => {
  const status = item.previewStatus!;
  counts[status] += 1;
  return counts;
}, { mountable: 0, "implementation-pending": 0, "unsupported-fit": 0, "nonvisual-spare": 0, "off-bike": 0 });
export const TAILFIN_CATALOG_COVERAGE = {
  checkedAt: "2026-10-02",
  mainFamilies: 50,
  spareFamilies: 95,
  sourceFamilies: 145,
  variants: 191,
  advertisedMainCount: 52,
  advertisedSparesCount: 96,
  note: "50 main product families and 95 spare families indexed; source banners show 52 and 96. This snapshot does not certify exhaustive SKU, color or option coverage. Entries without a preview remain searchable and are classified below. The all-components implementation request remains open.",
  sourceUrl: "https://www.tailfin.cc/ca/shop/",
};
