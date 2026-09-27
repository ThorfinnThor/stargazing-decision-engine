# Amazon.de gear link audit — 2026-09-27

## Result

All 30 configured Amazon.de product links were opened in the live Amazon browser UI. Product identity, selected variant and current purchase controls were checked. Twenty-seven exact, orderable links remain enabled: 24 expose a direct purchase control and three expose current new offers in Amazon's buying-options drawer.

Three mappings were removed fail-closed:

- Anker SOLIX C300 DC: ASIN `B0D62PMB3R` now redirects to ASIN `B0GY7DXWW6`, titled **C300X DC**. The guide deliberately covers C300 DC, not C300X DC.
- Explore Scientific 82° Series 11 mm: ASIN `B004QIDCNY` now redirects to ASIN `B004QIFC96` with **4.7 mm** selected. It is not the guide's 11 mm eyepiece.
- Omegon Smartphone Adapter 25–48 mm: the exact page remains, but Amazon reports it as currently unavailable and exposes no buying options.

The Celestron Nature DX 8×42 remains exact and orderable, but the current offer is shipped and sold by Amazon US. Its existing retailer UI therefore now shows the same import caveat used for the other Amazon US offers.

OneLink and the source tracking ID were not changed. Retained links continue to originate on `amazon.de` with `tag=stargazingindex-21`; the verified DE-to-US OneLink account mapping remains responsible for eligible visitor-country redirects.

## Per-product decision

| Product | ASIN | Decision | Live observation |
| --- | --- | --- | --- |
| Celestron Nature DX 8×42 | `B0B7CNPNJV` | Retain, import-labelled | Exact 72322 / 8×42 selection; direct purchase controls; Amazon US offer. |
| Petzl TIKKA CORE | `B0FDMFMNCL` | Retain | Exact TIKKA CORE, black selected; direct purchase controls. |
| Black Diamond Spot 400-R | `B09NQK87MN` | Retain | Exact rechargeable model; Graphite / One size selected; direct purchase controls. |
| NITECORE NU25 MCT UL | `B0F1KKYNR7` | Retain | Exact MCT UL title; direct purchase controls. |
| Vortex Mountain Pass Tripod Kit | `B0BRNS143M` | Retain | Exact aluminium tripod and pan-head kit; two new offers with Add to Basket in the buying-options drawer. |
| Manfrotto Befree 3-Way Live Advanced | `B083XK56QQ` | Retain | Exact aluminium 3-way Advanced style; direct purchase controls. |
| Anker SOLIX C300 DC | `B0D62PMB3R` | Remove | Redirects to C300X DC (`B0GY7DXWW6`), a different model. |
| Vortex Kaibab HD 18×56 | `B078XQWQ96` | Retain | Exact 18×56 title; direct purchase controls. |
| Bresser Messier 5-inch Dobson | `B07339DTYD` | Retain | Exact 5-inch 130/650 model; two new offers with Add to Basket in the buying-options drawer. |
| Celestron StarSense Explorer DX 130AZ | `B083JRF1MH` | Retain | Exact DX 130 style; direct purchase controls. |
| Nikon PROSTAFF P7 8×42 | `B0B3H83T1D` | Retain | Exact 8×42 title; direct purchase controls. |
| Nikon MONARCH M5 8×42 | `B09GW412RK` | Retain | Exact 8×42 title; direct purchase controls. |
| Nikon MONARCH M7 8×42 | `B09GW2DRCD` | Retain | Exact 8×42 page; six new offers with Add to Basket in the buying-options drawer. |
| Celestron TrailSeeker Tripod | `B00K8U2EBK` | Retain | Exact 82050 fluid-head tripod; direct purchase controls. |
| iOptron SkyGuider Pro | `B07199QMR6` | Retain | Exact SkyGuider Pro title; direct purchase controls. |
| Baader Morpheus 12.5 mm | `B07145KVCY` | Retain | Exact 12.5 mm / 76° title; direct purchase controls. |
| Explore Scientific 82° Series 11 mm | `B004QIDCNY` | Remove | Redirects to 4.7 mm (`B004QIFC96`), the wrong focal length. |
| Pentax SMC XF 12 mm | `B0007LAG8I` | Retain | Exact XF 12 mm title; direct purchase controls. |
| Celestron X-Cel LX 12 mm | `B0048JF1JY` | Retain | Exact 12 mm selection; direct purchase controls. |
| Celestron NexYZ 3-Axis Universal Smartphone Adapter | `B07D7V3B8M` | Retain | Exact 81055 / NexYZ 3-Axis style; direct purchase controls. |
| Omegon Smartphone Adapter 25–48 mm | `B0CZTZ6R7H` | Remove | Exact page, but currently unavailable with no buying options. |
| Celestron SkyMaster Pro ED 15×70 | `B0CC793PVS` | Retain | Exact ED 15×70 selection; direct purchase controls. |
| Celestron SkyMaster 20×80 | `B0007UQNTU` | Retain | Exact 20×80 style; direct purchase controls. |
| Celestron PowerTank Lithium | `B01G7J097Q` | Retain | Exact original PowerTank Lithium title/style; direct purchase controls. |
| Celestron Night Vision Flashlight | `B0000665V5` | Retain | Exact 93588 red night-vision flashlight; direct purchase controls. |
| Celestron Omni 12 mm | `B00008Y0SF` | Retain, import-labelled | Exact 12 mm selection; direct Amazon US purchase controls. |
| Celestron Smart DewHeater Controller 2X | `B09Y2HDX13` | Retain, import-labelled | Exact 2X selection; direct Amazon US purchase controls. |
| Move Shoot Move Tridaptor Metal | `B0CCJNSXLG` | Retain | Exact metal three-axis adapter; direct purchase controls. |
| Jackery Explorer 240 v2 | `B0CYLP7M8P` | Retain | Exact E240 v2 / 256 Wh / 300 W listing; direct purchase controls. |
| Vixen Polarie Star Tracker | `B0061I3EKI` | Retain | Exact original Polarie, without polar meter; direct purchase controls. |

## Method and limits

- Used the signed-in Amazon.de browser UI and the generated affiliate URLs with `th=1&psc=1`.
- For pages without a featured offer, opened the non-destructive buying-options drawer and verified current new offers with Add to Basket controls. No item was added and no checkout step was entered.
- Availability and seller status are time- and delivery-context-dependent. The repository records the check date, not prices, ratings or delivery promises.
- No Amazon images or customer content were copied. This audit changes no image licence status.
- A product page was not retained merely because it loaded: redirects to a different model or variant fail closed.

## Verification

- Targeted Amazon tests: 6 passed.
- Full test suite: 219 Node tests and 15 Python tests passed.
- Gear-data validation and TypeScript typecheck passed.
- Production build generated 703 static pages.
- Static-output validation passed for 993 HTML files and 51,775 same-origin references, including EN/DE route parity and discovery coverage.
- Exported HTML contains all 27 retained ASINs and none of the three removed ASINs. Both localized Nature DX pages render the Amazon US import caveat.
