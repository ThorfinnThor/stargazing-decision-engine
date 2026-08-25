# Astronomical sky

The homepage and destination sky domes are deterministic astronomical
simulations. The homepage randomly chooses only the location (or one validated
preview from that location); star and Moon positions never use randomness.

## Data and licensing

The compact catalog is derived from **HYG Stellar Database 4.1**, authored and
maintained by David Nash / Astronexus:

- Source: <https://github.com/astronexus/HYG-Database/blob/main/hyg/CURRENT/hygdata_v41.csv>
- Source commit: `ba2dec4eb0f6768914c7fc1051258100214ddf84`
- Upstream file SHA-256: `d9f69fd86bbf90a4e4d52b4c5c53eacfa6dfc0bfdef85bfd94f095e0bebe4ebd`
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Derivative: filtered to apparent magnitude `<= 6.0`, converted from J2000
  right ascension/declination to normalized EQJ vectors, non-runtime columns
  removed, deterministically sorted.
- Runtime catalog: 5,070 stars; no external astronomy request is made at runtime.

Rebuild from a verified local upstream file:

```bash
pnpm data:astronomy:catalog --input=/absolute/path/to/hygdata_v41.csv
pnpm data:astronomy:previews
pnpm data:astronomy:validate
```

The generated catalog derivative is redistributed under CC BY-SA 4.0. That
license and the attribution above apply to the catalog data; they do not grant a
license for unrelated project code.

## Computation

- Ephemerides and coordinate rotations: `astronomy-engine@2.1.19` (MIT).
- Observer: site latitude, longitude, and elevation.
- Time: UTC instant; labels use the destination's IANA timezone.
- Refraction: geometric/unrefracted for Sun, Moon, and stars.
- Stars: one EQJ-to-horizontal rotation matrix per snapshot.
- Projection: azimuthal equidistant full-sky dome, north up and east left.
- Moon: topocentric position and phase; bright-limb direction is projected
  toward the local Sun direction.
- Moon symbol diameter is intentionally enlarged and is not angular scale.
- Star point radius encodes apparent magnitude and is not angular diameter.

## Visibility and honesty

Geometric horizon visibility and a monotonic twilight limiting-magnitude model
are applied. At daylight the ordinary star catalog is not drawn. The simulation
does not include weather, haze, smoke, transparency, terrain, trees, buildings,
or temporary light sources. UI copy states this limitation in English and German.

## Static architecture

The server components load committed candidates and previews. Client components
select a homepage location after hydration, compute the current minute, draw one
Canvas, and update once per minute. Fixed previews have no timer. Destination
query strings are parsed after mount and validated against that destination and
its deterministic primary site.

## Homepage candidate contract

The committed data currently resolves these exact destination/site pairs. Each
preview ID is validated against the same pair before it can be displayed.

| Destination | Primary site | Preview |
| --- | --- | --- |
| atacama | atacama-plateau | atacama-night-2027 |
| namibrand | namibrand-reserve | namibrand-night-2027 |
| aoraki-mackenzie | lake-tekapo-basin | aoraki-mackenzie-night-2027 |
| tenerife | teide-high-zone | tenerife-night-2027 |
| death-valley | death-valley-dark-sky | death-valley-night-2027 |
| sutherland | sutherland-observatory | sutherland-night-2027 |
| big-bend | big-bend-panther-junction | big-bend-night-2027 |
| el-leoncito | el-leoncito-observatory | el-leoncito-night-2027 |
| hanle | hanle-dark-sky | hanle-night-2027 |
| canyonlands | canyonlands-dark-sky | canyonlands-night-2027 |
| elqui-valley | elqui-paihuano | elqui-valley-night-2027 |
| cederberg | cederberg-dark-sky | cederberg-night-2027 |
| great-basin | great-basin-wheeler-peak | great-basin-night-2027 |
| mcdonald-observatory | mcdonald-observatory | mcdonald-observatory-night-2027 |
| natural-bridges | natural-bridges-dark-sky | natural-bridges-night-2027 |
| alqueva | alqueva-lake-edge | alqueva-night-2027 |
| anza-borrego | anza-borrego-dark-sky | anza-borrego-night-2027 |
| kitt-peak | kitt-peak-observatory | kitt-peak-night-2027 |
| great-sand-dunes | great-sand-dunes-dark-sky | great-sand-dunes-night-2027 |
| central-tasmania | central-tasmania-dark-sky | central-tasmania-night-2027 |
| jasper | jasper-medicine-lake | jasper-night-2027 |
| montsec | montsec-observing-area | montsec-night-2027 |
| cherry-springs | cherry-springs-dark-sky | cherry-springs-night-2027 |
| mont-megantic | mont-megantic-observatory | mont-megantic-night-2027 |
| grasslands | grasslands-dark-sky | grasslands-night-2027 |
| witsand | witsand-dark-sky | witsand-night-2027 |
| eifel | eifel-dark-sky | eifel-night-2027 |
| kerry | kerry-dark-sky | kerry-night-2027 |
| exmoor | exmoor-dark-sky | exmoor-night-2027 |
| kielder | kielder-dark-sky | kielder-night-2027 |
| north-york-moors | dalby-forest-dark-sky | north-york-moors-night-2027 |
| rila | rila-dark-sky | rila-night-2027 |
| westhavelland | westhavelland-core | westhavelland-night-2027 |
| brecon-beacons | brecon-dark-sky | brecon-beacons-night-2027 |
| elan-valley | elan-valley-reservoir | elan-valley-night-2027 |
| galloway | galloway-dark-sky-park | galloway-night-2027 |
| pico-do-arieiro | pico-arieiro-observing-area | pico-do-arieiro-night-2027 |
| bieszczady | bieszczady-dark-sky | bieszczady-night-2027 |
| hortobagy | hortobagy-dark-sky | hortobagy-night-2027 |
| zselic | zselic-starry-sky | zselic-night-2027 |
| al-wathba | al-wathba-dark-sky | al-wathba-night-2027 |

## Verification snapshot

Measured locally on 2026-08-25 after a production static export:

- 50 deterministic destination previews validate; 41 destinations are eligible
  for random homepage promotion because their deterministic primary site also
  passes the travel-access gate.
- Compact catalog: 270,152 bytes uncompressed and 113,120 bytes gzip.
- Warm mean over 100 runs: 1.067 ms for homepage selection and 0.567 ms for a
  complete astronomical snapshot.
- Browser Canvas redraws observed during desktop QA: 0.8–1.5 ms at device pixel
  ratio capped to 2.
- Browser QA covered live navigation, fixed preview navigation, return to live,
  invalid cross-destination preview rejection, English/German labels, named
  months, and a daylight snapshot with zero visible catalog stars.

QA captures:

- [Homepage live sky](qa/astronomical-sky-homepage.png)
- [Destination fixed night preview](qa/astronomical-sky-destination-preview.png)
