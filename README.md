# 🚲 3D Bikepacking Rig Configurator

An interactive 3D web application to configure bikepacking setups with exact-fit gear, validate tire & bottle clearance in real-time 3D, calculate live axle weight distribution, and export gear manifests.

Designed and developed to resolve **[Issue #2](https://github.com/estebanl/bikepacking/issues/2)**.

---

## ✨ Features

- **Exact-Fit Bike Geometry & Sockets**:
  - Calibrated geometry models for popular bikepacking rigs:
    - **Salsa Cutthroat C GRX** (Sizes 56cm & 58cm)
    - **Trek Checkpoint SL 6** (Sizes 54cm & 56cm)
    - **Surly Ogre Expedition** (Sizes M & L)
  - Pre-indexed mounting socket anchors (`frameTriangle`, `seatpost`, `handlebar`, `topTubeFront`, `forkLeft_0`, `forkRight_0`, `downtubeUnderside`).

- **Curated Bikepacking Gear Catalog**:
  - Exact manufacturer specs, volume, dry weight, dimensions, and waterproof ratings for top brands:
    - **Ortlieb**: Frame-Pack RC 4L, Seat-Pack 16.5L, Handlebar-Pack 15L, Fork-Pack 4.1L
    - **Revelate Designs**: Terrapin System 14L, Sweetroll 11L, Ranger Full Triangle, Mag-Tank
    - **Apidura**: Expedition Saddle Pack 9L, Handlebar Pack 9L, Compact Frame Pack 4.5L, Racing Bolt-On Top Tube
    - **Salsa & Tailfin**: EXP Series Full Frame Pack, Cargo Cage Pack 5L

- **Real-Time 3D Clearance & Collision Engine**:
  - **Seat Pack vs. Rear Wheel**: Warns if clearance under dropper post compression drops below 100mm (or 80mm rigid).
  - **Handlebar Roll vs. Front Tire**: Alerts if tire clearance is under 50mm.
  - **Frame Pack vs. Bottle Cages**: Flags clipping between full frame packs and bottle cages.
  - **Visual Interference Highlights**: Intersecting bags glow with a bright red warning outline and trigger immediate HUD alerts.

- **Live Weight Distribution & Axle Balance**:
  - Total rig dry weight + optional packed gear payload estimate (sleep kit, water, cook system).
  - Physics-based moment calculation across front and rear wheelbases:
    $$\text{Front Ratio} = \frac{\sum (W_i \cdot d_{i,\text{rear}})}{\text{Wheelbase} \cdot W_{\text{total}}} \times 100\%$$
  - Real-time axle weight gauge highlighting the balanced 40–48% front sweet spot.

- **Simulation Controls & Camera Presets**:
  - **Dropper Post Compression Simulator**: Test dynamic saddle bag clearance.
  - **Bottle Cage Mount Toggle**: Test bottle clearance with frame packs.
  - **Camera View Presets**: Isometric, Side Profile, Cockpit, and Rear Tire views.

- **Sharing & Manifest Export Workflows**:
  - **Shareable URL**: Custom rig configuration serialized into URL query parameters.
  - **Itemized CSV Export**: One-click download for spreadsheets.
  - **Markdown Table**: Ready to paste into GitHub, Reddit, or LighterPack.
  - **Printable Summary**: Formatted view ready for browser printing or saving to PDF.

- **Canadian Bikepacking Routes Integration**:
  - Preserves Canadian GPX route maps and Leaflet interactive viewers accessible via the navigation bar.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 20 & Node 26)
- npm or yarn

### Installation
```bash
git clone https://github.com/estebanl/bikepacking.git
cd bikepacking
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm run start
```

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **State Management**: Zustand
- **Styling**: Tailwind CSS, Lucide Icons
- **Clearance Engine**: Geometric bounding & socket offset clearance validator
