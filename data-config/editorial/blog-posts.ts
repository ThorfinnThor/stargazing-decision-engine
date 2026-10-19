export interface BlogPostSource {
  slug: string;
  title: string;
  seoDescription: string;
  standfirst: string;
  publishedAt: string;
  lastReviewedAt: string;
  readingMinutes: number;
  heroDestinationSlug: string;
  datasetId: "monthly-atlas" | "darkness-versus-clear" | "altitude-versus-darkness" | "longest-night-versus-best-month" | "access-versus-score" | "dew-risk-spectrum";
  relatedDestinationSlugs: string[];
  methodologyNote: string;
  blocks: Array<
    | { kind: "prose"; heading: string; paragraphs: string[] }
    | { kind: "callout"; heading: string; body: string }
  >;
}

export const blogPostSources: BlogPostSource[] = [
  {
    slug: "where-to-stargaze-each-month",
    title: "Where to stargaze each month: a 12-stop data atlas",
    seoDescription: "A month-by-month stargazing atlas built from historical climate, darkness, comfort, access, and confidence data across 150 reviewed destinations.",
    standfirst: "There is no single best stargazing destination for every month. This atlas uses one repeatable rule to surface twelve different places, then explains what the scores can—and cannot—tell you before you travel.",
    publishedAt: "2026-10-17",
    lastReviewedAt: "2026-10-17",
    readingMinutes: 8,
    heroDestinationSlug: "namibrand",
    datasetId: "monthly-atlas",
    relatedDestinationSlugs: ["namibrand", "kalbarri", "great-western-woodlands", "death-valley", "richtersveld", "joshua-tree"],
    methodologyNote: "For each calendar month, we selected the highest Stargazing Trip score among active destinations with real score snapshots and a representative site marked public or limited access, without repeating a destination. Limited access can mean booking, guest-only use, permits, opening-hour constraints, or other conditions. Scores use 1991–2020 ERA5 climate normals and committed darkness, elevation, and access inputs; they are not forecasts.",
    blocks: [
      {
        kind: "prose",
        heading: "One question, one consistent selection rule",
        paragraphs: [
          "A calendar like this becomes misleading if the method changes from month to month. We therefore started with every active destination that has a complete real-data score series. For each month, we took the strongest Stargazing Trip score from a representative observing site that is labelled either publicly accessible or limited, and then removed that destination from the remaining months. The no-repeat rule turns the result into a useful atlas rather than a list dominated by one exceptional desert.",
          "The Stargazing Trip score is a decision score, not a measurement of how beautiful the Milky Way will look on a particular night. It combines sky quality with practical comfort. Darkness, historical cloud conditions, dew, wind, temperature, elevation, and the documented access input all matter. A result can therefore outrank a darker site if it is historically clearer or more comfortable in that month. Confidence is shown because a precise-looking rank should never hide weaker source coverage.",
        ],
      },
      {
        kind: "prose",
        heading: "How to read the twelve rows",
        paragraphs: [
          "Start with the trip score, then read sideways. Sky Quality concentrates on the observing environment, while Trip Comfort captures the practical side of spending time outside at night. The historical clear-night probability is the share of nights in the 1991–2020 climate sample that met the pipeline's clear-night definition. It is a long-run planning signal, not the chance that your booked night will be clear.",
          "The access column deserves equal attention. A site marked limited has evidence of a real location, but it may sit inside a reserve, lodge, campground, protected area, or bookable programme. The row is not permission to arrive after dark. Open the linked destination guide, follow its official source, and check current access, closures, bookings, road conditions, and local rules yourself before committing to the trip.",
        ],
      },
      {
        kind: "callout",
        heading: "The useful answer is not “book the winner”",
        body: "Use the atlas to build a shortlist for your month. Then compare travel distance, access, Moon phase, current forecasts, fire or weather closures, and whether the named observing site actually fits your equipment and experience.",
      },
      {
        kind: "prose",
        heading: "What the pattern says about seasonality",
        paragraphs: [
          "The sequence shifts between southern African dry-season locations, Australian sites, and arid North American destinations. That is not an editorial attempt to spread pins around a map; it is what happens when cloud climatology and night comfort are allowed to compete with darkness. Several locations remain excellent across a long season, but the no-repeat rule reveals credible alternatives instead of pretending that the same destination is the only rational choice all year.",
          "A monthly winner can also conceal a narrow trade-off. Very dark places may have limited visitor infrastructure. Comfortable places may carry more artificial light. A high annual reputation does not guarantee the strongest month-specific conditions. This is why the table keeps the component scores visible. If your priority is visual observing, astrophotography, warmth, or an easy public viewpoint, you may choose a different row than the combined ranking suggests.",
        ],
      },
      {
        kind: "prose",
        heading: "Turn a monthly signal into a real observing plan",
        paragraphs: [
          "Once you have a shortlist, move from climate to timing. Check the Moon for the exact travel dates, because monthly climate scores do not choose a moonless night for you. Look at a current weather forecast close to departure, and pay attention to wind, humidity, smoke, dust, and road conditions. Those fast-changing factors sit outside a historical normal and can reverse the practical decision on the day.",
          "Finally, treat every named site as a researched reference point rather than a guaranteed public observing pad. Conditions and rules change after our review date. Official park, reserve, campground, or operator information remains the authority for entry. The atlas is most valuable when it narrows a large world to a defensible shortlist while leaving the final, current decision in your hands.",
        ],
      },
    ],
  },
  {
    slug: "darkest-sky-versus-clearest-night",
    title: "The darkest sky is not always the clearest night",
    seoDescription: "Darkness and clear-night probability measure different things. Compare real destination data to see why a dark site can still be a poor weather bet.",
    standfirst: "Light pollution and cloud climate answer different questions. Six destinations show why a perfect darkness score can coexist with very different odds of a usable night.",
    publishedAt: "2026-10-17",
    lastReviewedAt: "2026-10-17",
    readingMinutes: 7,
    heroDestinationSlug: "great-barrier-island",
    datasetId: "darkness-versus-clear",
    relatedDestinationSlugs: ["namibrand", "great-barrier-island", "kangaroo-island", "rakiura", "death-valley", "richtersveld"],
    methodologyNote: "Darkness is the committed site-level score derived from Black Marble artificial-light exposure. Clear-night probability is the simple mean of twelve monthly probabilities in the 1991–2020 ERA5 climate snapshot for the representative site. Annual trip and sky-quality figures are simple means of the twelve published monthly scores. These aggregates are descriptive, not live forecasts.",
    blocks: [
      {
        kind: "prose",
        heading: "Two variables that are easy to confuse",
        paragraphs: [
          "A dark sky describes the absence of artificial light in and around an observing location. A clear night describes the atmosphere above it. The first can remain broadly stable for years; the second changes with weather and has a strong seasonal pattern. Putting both ideas under the loose label “good stargazing” makes recommendations sound simpler than the underlying decision really is.",
          "Our darkness score is derived from committed Black Marble radiance inputs and the calibrated artificial-light model. The clear-night figure comes from thirty-year ERA5 climate normals. Neither is a live reading. Read together, however, they expose a practical distinction: a remote island can be exceptionally dark and still have a maritime cloud climate, while a desert site can combine low artificial light with many historically clear nights.",
        ],
      },
      {
        kind: "prose",
        heading: "The same darkness score can hide a different trip",
        paragraphs: [
          "The comparison includes several sites with the maximum darkness score. Their historical clear-night averages are far from identical, and their annual trip scores separate accordingly. That gap is not a contradiction. Darkness protects contrast when the sky is clear; it does not remove clouds, moisture, wind, or an uncomfortable temperature. A destination can therefore be optically promising but operationally risky for a short, fixed-date trip.",
          "The reverse deserves care too. A strong clear-night average does not make a bright site dark. Clear air over a light dome can still wash out faint structure. For visual deep-sky observing and wide-field astrophotography, artificial light remains a hard constraint. For lunar or planetary observing, outreach, or a flexible trip with other daytime goals, a somewhat brighter but reliably clear location may still be the rational choice.",
        ],
      },
      {
        kind: "callout",
        heading: "Darkness protects the view; climate determines how often you may get it",
        body: "A high darkness score is a necessary strength for faint targets, not a promise of cloud-free weather. Compare darkness, clear-night history, month, and trip flexibility before treating any destination as a safer bet.",
      },
      {
        kind: "prose",
        heading: "Choose according to the cost of failure",
        paragraphs: [
          "If you can stay for a week and change plans night by night, a dark but cloudier destination may be worth the gamble. If you have one evening at the end of a costly journey, historical cloud reliability deserves more weight. A photographer pursuing faint nebulae may accept lower weather odds for truly dark conditions; a family planning a first naked-eye session may value comfort, simple access, and a reasonable chance of any clear window.",
          "This is also why annual averages should begin a comparison rather than finish it. A destination with a modest annual clear-night figure may have a useful dry-season window. Open its monthly profile before ruling it out. Conversely, an excellent annual figure can conceal a weaker month. The correct unit of planning is the destination, the month, and the actual date—not the destination name alone.",
        ],
      },
      {
        kind: "prose",
        heading: "What still has to be checked close to departure",
        paragraphs: [
          "Historical normals cannot see the forecast for your night. They also do not fully describe local fog, low cloud against terrain, smoke, dust, temporary lighting, vegetation, buildings, or a blocked horizon at the exact place where you stand. The representative site anchors the data consistently, but conditions can vary inside a large park or island.",
          "Use the table to understand the structural trade-off. Then check the current forecast, satellite and smoke information where relevant, Moon phase, and the official access source. If a site is limited or booking-only, confirm its terms directly through the published operator or authority information. The score narrows uncertainty; it does not transfer responsibility for a current access or safety decision.",
        ],
      },
    ],
  },
  {
    slug: "does-altitude-mean-darker-skies",
    title: "Does higher altitude mean darker skies? The data says no",
    seoDescription: "Compare high and low stargazing sites to separate elevation from artificial light, climate, comfort, and access in dark-sky trip planning.",
    standfirst: "Elevation can put you above some haze and atmospheric mass, but it does not switch off nearby lights or guarantee clear weather. Eight real sites reveal the trade-off.",
    publishedAt: "2026-10-17",
    lastReviewedAt: "2026-10-17",
    readingMinutes: 7,
    heroDestinationSlug: "hanle",
    datasetId: "altitude-versus-darkness",
    relatedDestinationSlugs: ["hanle", "mauna-kea", "cerro-paranal", "great-basin", "kalbarri", "richtersveld", "great-barrier-island", "rakiura"],
    methodologyNote: "Elevation is the representative site's committed elevation value. Darkness, Sky Quality, and Stargazing Trip are the published site scores; annual values are simple means of the twelve monthly rows. Elevation is only one score component, and the comparison is not a live forecast. It does not claim that the sites offer equivalent access, oxygen risk, horizons, infrastructure, or observing permissions.",
    blocks: [
      {
        kind: "prose",
        heading: "Elevation and darkness are not synonyms",
        paragraphs: [
          "High observatories are built where thin, dry air and favourable atmospheric conditions can improve professional observing. That association often turns into an overly broad travel rule: higher must mean darker. But artificial light is generated on the ground and spreads across distance. A mountain above a city can remain exposed to a substantial light dome, while a remote beach or desert plain can sit under an exceptionally dark sky close to sea level.",
          "The data separates these ideas. Elevation is measured in metres. Darkness is derived from artificial-light exposure. Sky Quality also accounts for historical cloud conditions, dew, and elevation, while Stargazing Trip adds practical comfort and access. Two sites with similar heights can therefore receive different scores, and a low site can outperform a mountain when remoteness and climate work in its favour.",
        ],
      },
      {
        kind: "prose",
        heading: "What altitude can improve—and what it cannot",
        paragraphs: [
          "Elevation can reduce the amount of atmosphere above an observer and may place a site above some low-level haze or moisture. In a suitable climate, that is valuable. It can also bring colder temperatures, stronger exposure, difficult roads, rapid weather changes, and altitude illness. A summit designed for research is not automatically a visitor attraction, and a named observing zone may have strict nighttime rules.",
          "Altitude cannot erase regional artificial light, clouds at the observing level, wind, smoke, dust, or local obstructions. Nor can it make an inaccessible site useful to a traveller. This is why the comparison keeps annual Sky Quality and Trip scores beside height and darkness. The combined scores do not diminish altitude; they put it in the correct decision context.",
        ],
      },
      {
        kind: "callout",
        heading: "Treat elevation as a modifier, not a destination strategy",
        body: "First ask whether the site is dark, historically clear in your month, legally accessible, and practical for your group. Use elevation to refine that shortlist—not to create it by itself.",
      },
      {
        kind: "prose",
        heading: "Why low-elevation sites remain competitive",
        paragraphs: [
          "The low sites in the table are not identical. Some benefit from dry continental conditions; others are maritime and pay a cloud penalty despite excellent darkness. Their shared lesson is narrower: low elevation does not impose a low darkness score. Remoteness, settlement patterns, and regional lighting can matter more for artificial-light exposure than height above sea level.",
          "A low site can also be easier to reach and physically easier to use. That does not guarantee public nighttime access. Campgrounds, reserves, beaches, and private properties carry different rules, and a site marked limited may require booking or permission. Practical advantage should be demonstrated from current official information rather than inferred from a road on a map.",
        ],
      },
      {
        kind: "prose",
        heading: "Build a safer high-altitude plan",
        paragraphs: [
          "If a high site remains on your shortlist, check the official visitor policy, road status, weather, required reservations, acclimatisation advice, and whether private vehicles are allowed after dark. Bring clothing for the actual nighttime range rather than the daytime temperature in the nearest town. A high score is not medical or access guidance.",
          "For the observing decision, compare the exact month. Annual means make the structural relationship visible, but seasonal cloud and comfort can change the result. Then add the Moon phase and a current forecast. The best destination is not the highest point you can name; it is the place where darkness, atmosphere, timing, access, and your tolerance for risk align.",
        ],
      },
    ],
  },
  {
    slug: "longest-night-is-not-always-best-month",
    title: "The longest night is not always the best stargazing month",
    seoDescription: "Long winter darkness can lose to clearer, warmer months. Compare six destinations where the best trip score arrives outside the longest-night month.",
    standfirst: "More hours of astronomical darkness sound automatically better. Climate and comfort often disagree, especially at high latitudes. Six destination profiles show why.",
    publishedAt: "2026-10-17",
    lastReviewedAt: "2026-10-17",
    readingMinutes: 8,
    heroDestinationSlug: "wood-buffalo",
    datasetId: "longest-night-versus-best-month",
    relatedDestinationSlugs: ["wood-buffalo", "rakiura", "waterton-lakes", "galloway", "jasper", "central-idaho"],
    methodologyNote: "The longest-night month is the month with the largest average astronomical-hour count in the representative site's 1991–2020 ERA5 snapshot. Average hours are the snapshot's astronomical-hour count divided by its sample-year count. The best month is the highest published Stargazing Trip score. Ties follow source order. Results are historical planning signals, not forecasts.",
    blocks: [
      {
        kind: "prose",
        heading: "Darkness duration solves only one part of the problem",
        paragraphs: [
          "At high latitudes, winter provides long stretches when the Sun remains far enough below the horizon for astronomical darkness. If observing time were the only variable, the darkest month would be the obvious choice. A traveller still needs cloud-free sky, tolerable wind and temperature, safe access, and equipment that works in the conditions. Extra dark hours have little value when clouds cover them or severe cold makes the session unrealistic.",
          "The table compares the longest-night month with the month that receives the highest Stargazing Trip score at the same representative site. Every row uses the same historical climate normal and published scoring method. The point is not that winter is bad. It is that duration and usability should remain separate variables until the trip goal is clear.",
        ],
      },
      {
        kind: "prose",
        heading: "Why the winning month moves",
        paragraphs: [
          "Cloud climate is often the largest reason. Some northern destinations gain far clearer conditions in late summer or early autumn than in the deepest winter. Temperature and wind then widen the practical gap. The combined score can rise sharply even though the month offers fewer total astronomical hours. A shorter window that is clearer and comfortable may provide more realistic observing time than a very long but frequently unusable night.",
          "Southern maritime destinations show a related pattern. Their winter nights are long, yet persistent cloud or moisture can hold back the combined score. A shoulder-season month may provide a better balance. The exact result is local, which is why a generic rule such as “go in winter” is too weak for expensive travel planning.",
        ],
      },
      {
        kind: "callout",
        heading: "Usable darkness beats theoretical darkness",
        body: "For a fixed-date trip, prefer the month that balances clear-night history, darkness duration, temperature, wind, and access. For a flexible specialist trip, you may deliberately accept harsher conditions to gain longer sessions.",
      },
      {
        kind: "prose",
        heading: "The score should follow your observing goal",
        paragraphs: [
          "An astrophotographer collecting many hours on a faint target may value a long uninterrupted winter night more than the combined trip score does. A visual observer, beginner, or family group may benefit more from a shorter but warmer and historically clearer window. Aurora travel introduces another goal again: darkness matters, but geomagnetic activity and cloud remain separate uncertainties.",
          "The table reports one general-purpose trip score because a common baseline makes destinations comparable. It is not a command. Use the component data in each destination profile to override the default when your priorities are different. A transparent model is useful precisely because you can see why you disagree with its combined result.",
        ],
      },
      {
        kind: "prose",
        heading: "Plan the date after choosing the season",
        paragraphs: [
          "A monthly climate normal cannot tell you which weekend will work. After identifying a stronger season, check the Moon for the specific dates, then use a current forecast as departure approaches. At cold destinations, confirm seasonal roads, campground or park operations, heating and battery performance, and whether nighttime parking is permitted. Long darkness does not imply that visitor facilities remain open.",
          "Finally, keep the historical nature of the comparison in view. The climate sample describes 1991–2020, while access and site evidence carry their own review dates. Weather, closures, wildfire smoke, storms, and local rules change faster. The data is designed to choose a sensible planning window; current official information and real-time conditions must make the final call.",
        ],
      },
    ],
  },
  {
    slug: "highest-stargazing-score-limited-access",
    title: "The highest stargazing score may come with limited access",
    seoDescription: "Compare public and limited-access stargazing destinations to see why a higher sky score does not automatically make a trip easier to execute.",
    standfirst: "A remarkable score answers what conditions may offer. It does not answer whether you can simply arrive, park, and observe. Eight leading destinations show why access belongs beside sky quality in every shortlist.",
    publishedAt: "2026-10-19",
    lastReviewedAt: "2026-10-19",
    readingMinutes: 8,
    heroDestinationSlug: "big-bend",
    datasetId: "access-versus-score",
    relatedDestinationSlugs: ["big-bend", "natural-bridges", "death-valley", "capitol-reef", "namibrand", "grand-canyon-parashant", "sutherland", "kalbarri"],
    methodologyNote: "We selected the four active real-data destinations with the highest annual mean Stargazing Trip score in each of two representative-site access groups: public and limited. Annual Sky Quality and Trip values are simple means of the twelve published monthly scores; the best month is the highest monthly Trip score. Access is the reviewed catalog status, not a guarantee of current entry, and the comparison is not a live forecast.",
    blocks: [
      {
        kind: "prose",
        heading: "A score and an access label answer different questions",
        paragraphs: [
          "Stargazing rankings become dangerous when they collapse the observing environment and the visitor experience into one promise. Sky Quality describes the strength of the natural observing conditions represented in the model. The Stargazing Trip score adds practical comfort and access inputs, but even a strong combined result cannot reproduce every booking rule, gate time, road restriction, permit, guest-only condition, or local closure. A place can deserve its score and still be the wrong choice for an unplanned evening.",
          "The access label is deliberately plain. Public means the representative site has documented public use, while limited means that use depends on a condition such as a reservation, accommodation, tour, permit, seasonal operation, difficult route, or restricted visitor footprint. Neither label means unrestricted access at every hour. Both require a current check of the official source linked from the destination guide before travel.",
        ],
      },
      {
        kind: "prose",
        heading: "Why limited-access leaders can top the table",
        paragraphs: [
          "Several limited-access destinations protect exceptional darkness precisely because they are remote, managed, or lightly developed. That can support an outstanding score while reducing spontaneity. A reserve lodge, research area, primitive desert road, or bookable programme may provide a carefully controlled route into a dark landscape. The same controls that preserve the environment can also mean that arriving without the required booking or vehicle is not a viable plan.",
          "The table therefore does not demote limited locations. It makes their transaction cost visible. A high annual mean can justify the extra preparation for a dedicated trip, especially when the destination is the main purpose of travel. It may be a poor choice for a one-night detour, a late arrival, or a group that needs predictable facilities. The correct comparison is not simply score against score; it is score against the effort and uncertainty required to use the exact site legally and safely.",
        ],
      },
      {
        kind: "callout",
        heading: "The practical winner is the best site you can actually use",
        body: "Treat a limited-access leader as a planned product, booking, or route—not as a pin on a map. A slightly lower-scoring public site can be the stronger decision when time, transport, mobility, or same-day flexibility matters more than the final few score points.",
      },
      {
        kind: "prose",
        heading: "Public does not mean frictionless",
        paragraphs: [
          "The public group contains national parks and other recognised visitor settings, but its label is not permission to ignore local rules. Entrance stations can close, roads can be seasonal, campgrounds may require reservations, and individual overlooks or trails may prohibit overnight use. Weather, wildfire, flooding, snow, wildlife, or maintenance can remove the usable route even when the wider destination remains open. Public access reduces one category of uncertainty; it does not eliminate planning.",
          "Public destinations can nevertheless carry a decisive advantage: they often offer a clearer official visitor framework. Published maps, alerts, parking rules, campground systems, and ranger information make it easier to determine where a night visit belongs. That institutional clarity can be more valuable than a small score difference, particularly for first-time visitors or travellers who cannot absorb a failed access attempt after a long drive.",
        ],
      },
      {
        kind: "prose",
        heading: "Build the shortlist in the right order",
        paragraphs: [
          "Begin with the month-specific data rather than the annual mean shown here. Confirm that the sky and comfort profile fits your dates, then open the destination guide and identify one exact observing footprint. Follow its official source to check current opening, booking, vehicle, fee, camping, and after-dark conditions. If any essential condition is unclear, choose a documented alternative instead of extending the destination label to a roadside pull-off or open-looking land nearby.",
          "Only after the route is workable should you add the Moon phase and a current weather forecast. Keep a simple cancellation threshold for cloud, wind, smoke, unsafe roads, or a closed facility. The score is most useful when it helps compare viable plans. It is least useful when an impressive number persuades someone to improvise around a missing reservation, locked gate, private boundary, or route that should have been rejected before departure.",
        ],
      },
    ],
  },
  {
    slug: "dew-risk-at-dark-sky-sites",
    title: "A dark site can still be damp: why dew risk belongs in the plan",
    seoDescription: "Compare historical dew risk at eight stargazing destinations and learn why darkness and clear-night probability do not protect optics from condensation.",
    standfirst: "Artificial light may be low and the sky may open, yet moisture can still end an observing session. Eight real-data destinations reveal how widely historical nighttime dew risk varies.",
    publishedAt: "2026-10-19",
    lastReviewedAt: "2026-10-19",
    readingMinutes: 8,
    heroDestinationSlug: "elan-valley",
    datasetId: "dew-risk-spectrum",
    relatedDestinationSlugs: ["death-valley", "joshua-tree", "alula", "namibrand", "elan-valley", "poloniny", "attersee-traunsee", "yorkshire-dales"],
    methodologyNote: "We calculated annual means from the twelve monthly values in each representative site's 1991–2020 ERA5 climate snapshot, then selected the four lowest and four highest dew-risk means among active real-data destinations whose access is public or limited. The pipeline flags dew risk when nighttime air temperature is within 2°C of the dew point. Clear-night probability and dew risk are separate historical signals, not a claim that they occur simultaneously, and they are not a live forecast.",
    blocks: [
      {
        kind: "prose",
        heading: "Darkness does not keep glass dry",
        paragraphs: [
          "A dark-sky designation or an excellent artificial-light score says nothing about how close the nighttime air may be to saturation. When an exposed optical surface cools, moisture can condense on lenses, corrector plates, eyepieces, camera bodies, and cases. Contrast falls, photographs soften, and a session can become an exercise in packing damp equipment. The sky can look promising while the observing system quietly approaches its practical limit.",
          "Our climate pipeline treats dew as its own variable. An hour is flagged when the air temperature sits within two degrees Celsius of the dew point during astronomical night. The annual percentage in the table is the mean of twelve monthly probabilities, not a measurement from the exact field where a telescope will stand. It is useful as a comparative planning signal because it separates moisture exposure from darkness, clouds, and wind instead of hiding them inside one score.",
        ],
      },
      {
        kind: "prose",
        heading: "The dry and damp ends of the catalog are far apart",
        paragraphs: [
          "The selected destinations deliberately show the two ends of the observed distribution. Arid desert environments produce very low historical dew-risk means, while Atlantic, upland, and continental sites can spend much more nighttime near the dew point. That difference affects equipment planning and tolerance for a fixed date. It does not make the dry group universally better: heat, dust, wind, road exposure, access, and extreme remoteness remain separate constraints.",
          "The clear-night column must also be read independently. A clear-night probability describes historical cloud conditions under the pipeline definition. Dew risk describes the temperature-to-dew-point relationship across astronomical-night hours. The two aggregates are not a joint probability, so the table cannot tell you that a particular clear night will be wet. It can tell you that ignoring moisture is a much larger gamble at some destinations than at others.",
        ],
      },
      {
        kind: "callout",
        heading: "Clear is not the same as dry",
        body: "Use cloud history to estimate whether the sky may open and dew history to decide how resilient the observing setup should be. For the actual night, check the current temperature, dew point, wind, and forecast together.",
      },
      {
        kind: "prose",
        heading: "What dew changes in a field plan",
        paragraphs: [
          "At a higher-risk destination, prevention belongs in the plan before darkness. A dew shield can delay radiative cooling of exposed optics; a correctly sized heater and a tested power supply can protect longer sessions. Keep caps, cloths, cables, and electronics organised so that a hurried response does not introduce bright light or damage. Equipment should return indoors capped or uncapped according to a deliberate acclimatisation routine, not be sealed wet in a case and forgotten.",
          "Naked-eye observers are not exempt from the signal. Condensation can wet seating, paper charts, clothing, and vehicle surfaces, while damp cold feels different from the same air temperature in a dry climate. The right response may be a shorter session, a sheltered official observing area, or a setup that can be packed quickly. No score requires someone to remain outside after comfort, visibility, or safe footing has deteriorated.",
        ],
      },
      {
        kind: "prose",
        heading: "Move from climate history to tonight's decision",
        paragraphs: [
          "Use the annual comparison to recognise structural risk, then open the destination's monthly profile. Moisture can be seasonal, and an annual mean may hide a substantially drier window. Once dates are fixed, replace climate history with a current forecast and watch the temperature-dew-point spread through the planned observing hours. Local water, vegetation, valleys, fog, and exposed slopes can produce conditions that a broad reanalysis grid does not resolve.",
          "Finally, keep access and weather in the same decision. A dry forecast does not reopen a closed road, and a valid booking does not make condensation harmless. Confirm the exact observing footprint, the return route, and the equipment response before departure. The value of the dew signal is not that it predicts failure; it makes one preventable source of failure visible early enough to choose a better month, bring the right protection, or shorten the plan without surprise.",
        ],
      },
    ],
  },
];
