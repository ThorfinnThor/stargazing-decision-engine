import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LightPollutionComparison, type ComparisonDestination } from "@/components/sky/light-pollution-comparison";
import { bortleScaleSourceUrl, darkestSky, skySituations, type CitySkyFile } from "@/lib/astronomy/light-pollution";
import { listDestinationEditorialGuides, loadDestinations, loadSeoPage, loadSeoRegistry, loadSites } from "@/lib/data/load";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildWebPageStructuredData } from "@/lib/seo/structured-data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const copy = {
  en: {
    title: "Your sky vs. the darkest sky",
    description: "How many stars does light pollution take from you? Compare your night sky with the darkest sky on Earth, star by star, for tonight.",
    eyebrow: "Light pollution · comparison",
    lede: "Pick where you live and see the same sky at the same moment twice: once with the light around you, once as dark as it gets at the best observing sites.",
  },
  de: {
    title: "Dein Himmel vs. der dunkelste Himmel",
    description: "Wie viele Sterne nimmt dir die Lichtverschmutzung? Vergleiche deinen Nachthimmel mit dem dunkelsten Himmel der Erde, Stern für Stern, für heute Nacht.",
    eyebrow: "Lichtverschmutzung · Vergleich",
    lede: "Wähle, wo du wohnst, und sieh denselben Himmel zur selben Uhrzeit zweimal: einmal mit dem Licht deiner Umgebung, einmal so dunkel wie an den besten Beobachtungsorten.",
  },
} as const;

// Present once the Black Marble city workflow has run; the page works without it.
function citySkySource(): (CitySkyFile["source"] & { count: number }) | null {
  const path = resolve(process.cwd(), "public/data/stargazing/astronomy/city-sky.json");
  if (!existsSync(path)) return null;
  const file = JSON.parse(readFileSync(path, "utf8")) as CitySkyFile;
  return { ...file.source, count: file.cities.length };
}

function readParams(params: { locale: string }) {
  if (!isLocale(params.locale)) return null;
  const locale = params.locale as Locale;
  return { locale, seo: loadSeoPage(localizedLinks.lightPollutionComparison(locale)) };
}

// Destinations with a published, indexable guide, placed at the mean of their active observing sites.
function comparisonDestinations(locale: Locale): ComparisonDestination[] {
  const guides = new Set(listDestinationEditorialGuides());
  const indexable = new Set(loadSeoRegistry().pages.filter((page) => page.indexable).map((page) => page.path));
  const sites = loadSites().filter((site) => site.active);
  return loadDestinations()
    .filter((destination) => destination.active && guides.has(destination.slug) && indexable.has(localizedLinks.destination(locale, destination.slug)))
    .flatMap((destination) => {
      const own = sites.filter((site) => site.destinationId === destination.id);
      if (own.length === 0) return [];
      const lat = own.reduce((sum, site) => sum + site.lat, 0) / own.length;
      const lon = own.reduce((sum, site) => sum + site.lon, 0) / own.length;
      return [{ slug: destination.slug, name: destination.name, countryName: destination.countryName, lat: Number(lat.toFixed(3)), lon: Number(lon.toFixed(3)) }];
    });
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolved = readParams(await params);
  if (!resolved) return {};
  const text = copy[resolved.locale];
  return buildSeoMetadata({ seo: resolved.seo, locale: resolved.locale, title: text.title, description: text.description, image: `/images/share/light-pollution-comparison-${resolved.locale}.jpg` });
}

export default async function LightPollutionComparisonPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolved = readParams(await params);
  if (!resolved) notFound();
  const { locale, seo } = resolved;
  const de = locale === "de";
  const text = copy[locale];
  const cities = citySkySource();
  const count = (value: number) => new Intl.NumberFormat(de ? "de-DE" : "en-US").format(value);
  const magnitude = (value: number) => (de ? value.toFixed(1).replace(".", ",") : value.toFixed(1));
  const structuredData = buildWebPageStructuredData({ name: seo?.title ?? text.title, description: seo?.description ?? text.description, url: seo?.canonical ?? `https://stargazingindex.com${localizedLinks.lightPollutionComparison(locale)}`, inLanguage: locale, isPartOf: "Stargazing Index", dateModified: seo?.lastModified });

  return (
    <main className="event-page lp-page" lang={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="event-header">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className="lede">{text.lede}</p>
      </header>

      <LightPollutionComparison locale={locale} destinations={comparisonDestinations(locale)} />

      <section className="event-summary" aria-labelledby="lp-method-title">
        <h2 id="lp-method-title">{de ? "So entsteht der Vergleich" : "How the comparison works"}</h2>
        <p>{de
          ? "Beide Himmel zeigen dieselben Sterne zur selben Zeit über derselben Stadt. Der einzige Unterschied ist die Grenzhelligkeit: die schwächste Sternhelligkeit, die man mit bloßem Auge noch erkennt. Je heller der Himmel durch künstliches Licht ist, desto früher ist Schluss."
          : "Both skies show the same stars at the same moment above the same city. The only difference is the limiting magnitude: the faintest star brightness the naked eye can still pick out. The brighter artificial light makes the sky, the sooner that limit is reached."}</p>
        <p>{de
          ? "Für jede Wohnlage verwenden wir den bestmöglichen Wert, den John Bortle für die passende Klasse seiner Dunkelheitsskala angibt. Gezählt werden die Sterne des HYG-Katalogs, die über dem Horizont stehen und hell genug sind."
          : "For each setting we use the best-case value John Bortle gives for the matching class of his dark-sky scale. We count the stars of the HYG catalogue that are above the horizon and bright enough."}</p>
        <div className="lp-table-wrap">
          <table className="lp-table">
            <thead><tr><th>{de ? "Wohnlage" : "Setting"}</th><th>{de ? "Bortle-Klasse" : "Bortle class"}</th><th>{de ? "Sterne bis Helligkeit" : "Stars down to magnitude"}</th></tr></thead>
            <tbody>
              {skySituations.map((situation) => <tr key={situation.id}><td>{situation.label[locale]}</td><td>{situation.bortle}</td><td>{magnitude(situation.limitingMagnitude)}</td></tr>)}
              <tr><td>{de ? "Dunkelster Himmel" : "Darkest sky"}</td><td>{darkestSky.bortle}</td><td>{magnitude(darkestSky.limitingMagnitude)}</td></tr>
            </tbody>
          </table>
        </div>
        {cities ? (
          <>
            <h3>{de ? "Die Schätzung für deine Stadt" : "The estimate for your city"}</h3>
            <p>{de
              ? `Für ${count(cities.count)} Städte schätzen wir die Himmelshelligkeit im Zentrum aus Satellitendaten. Grundlage ist NASAs Black-Marble-Jahreskomposit ${cities.blackMarble.year}, das künstliches Licht bei Nacht misst. Wie für unsere Beobachtungsorte gewichten wir das Licht im Umkreis von 75 km: am stärksten die ersten 2 km, schwächer die weiteren Ringe.`
              : `For ${count(cities.count)} cities we estimate the sky brightness at the centre from satellite data: NASA's Black Marble ${cities.blackMarble.year} annual composite, which measures artificial light at night. As for our observing sites, we weight the light within 75 km, the first 2 km most and the outer rings less.`}</p>
            <p>{de
              ? "Diesen Wert ordnen wir an Orten ein, deren Himmel wir kennen. Dunkle Referenzorte entsprechen Bortle 1 bis 3, ländliche Orte nahe Kleinstädten Bortle 5, Stadtränder Bortle 6. Die Zentren von 20 Metropolen wie Berlin, Paris oder New York entsprechen Bortle 7 bis 9. Dazwischen rechnen wir linear."
              : "We place that value against sites whose skies we know: dark reference sites are Bortle 1 to 3, countryside near towns Bortle 5, the edge of a city Bortle 6, and the centres of 20 metropolitan areas such as Berlin, Paris and New York Bortle 7 to 9. In between we interpolate linearly."}</p>
            <p>{de
              ? <>Zur Kontrolle haben wir die Schätzung mit Messungen von 65 Stationen aus vier Veröffentlichungen verglichen: <a href="https://arxiv.org/abs/1803.09811" rel="noopener">Oberösterreich</a>, <a href="https://arxiv.org/abs/2507.11343" rel="noopener">Niederlande und Norddeutschland</a>, <a href="https://doi.org/10.3390/jimaging5050056" rel="noopener">Venetien</a> und <a href="https://doi.org/10.1098/rsos.160541" rel="noopener">Galicien</a>. Die Reihenfolge von dunkel nach hell stimmt gut überein. Wie viele Sterne man bei einer gemessenen Helligkeit sieht, lässt sich aber nur ungefähr umrechnen, siehe <a href="https://arxiv.org/abs/1405.4209" rel="noopener">Crumey (2014)</a>. Für mittelgroße Städte kann die Grenze deshalb um etwa 0,4 Größenklassen nach oben oder unten abweichen, in sehr hellen Zentren auch mehr.</>
              : <>As a check we compared the estimate with measurements from 65 stations in four publications: <a href="https://arxiv.org/abs/1803.09811" rel="noopener">Upper Austria</a>, <a href="https://arxiv.org/abs/2507.11343" rel="noopener">the Netherlands and northern Germany</a>, <a href="https://doi.org/10.3390/jimaging5050056" rel="noopener">Veneto</a> and <a href="https://doi.org/10.1098/rsos.160541" rel="noopener">Galicia</a>. The order from dark to bright agrees well. How many stars you see at a measured brightness can only be converted roughly, see <a href="https://arxiv.org/abs/1405.4209" rel="noopener">Crumey (2014)</a>. For mid-size cities the limit can therefore be about 0.4 magnitudes higher or lower, and more in very bright centres.</>}</p>
          </>
        ) : null}
        <p className="lp-source">{de ? "Quelle: " : "Source: "}<a href={bortleScaleSourceUrl} rel="noopener">{de ? "Sky & Telescope, „Light Pollution and Astronomy: How Dark Are Your Night Skies?“ (Bortle-Skala)" : "Sky & Telescope, “Light Pollution and Astronomy: How Dark Are Your Night Skies?” (Bortle scale)"}</a>{de ? " · Sterndaten: HYG Stellar Database 4.1, CC BY-SA 4.0." : " · Star data: HYG Stellar Database 4.1, CC BY-SA 4.0."}
          {cities ? <>{de ? " · Nachtlicht: NASA Black Marble (" : " · Night light: NASA Black Marble ("}{cities.blackMarble.product}, {cities.blackMarble.year}){de ? " · Städte und Namen: " : " · Cities and names: "}<a href="https://www.geonames.org/" rel="noopener">GeoNames</a>, {cities.cities.license}.</> : null}</p>
      </section>

      <section className="event-summary" aria-labelledby="lp-limits-title">
        <h2 id="lp-limits-title">{de ? "Was der Vergleich nicht weiß" : "What the comparison does not know"}</h2>
        <ul>
          <li>{de ? "Der dunkelste Himmel ist eher noch untertrieben: Unter Bortle-Klasse 1 bis 3 sieht man Sterne bis Helligkeit 6,6 bis 8,0. Unsere Sterndaten reichen bis 6,5." : "The darkest sky is, if anything, understated: under Bortle classes 1 to 3 stars down to magnitude 6.6 to 8.0 are visible. Our star data stops at 6.5."}</li>
          <li>{de ? "Die Werte gelten für geübte, an die Dunkelheit gewöhnte Augen. Wer gerade aus einem hellen Raum kommt, sieht deutlich weniger." : "The values assume trained eyes that are adapted to the dark. Step out of a bright room and you will see noticeably fewer stars."}</li>
          <li>{de ? "Mondlicht, Wolken, Dunst und Hindernisse am Horizont sind nicht eingerechnet." : "Moonlight, clouds, haze and obstructions on the horizon are not included."}</li>
          {cities ? (
            <>
              <li>{de ? "Die Satellitenschätzung gilt für das Stadtzentrum. In Außenbezirken ist der Himmel meist dunkler. Wähle dann die passende Wohnlage." : "The satellite estimate is for the city centre. Outer districts usually have darker skies, so pick the matching setting there."}</li>
              <li>{de ? "Der Satellit sieht das blaue Licht weißer LEDs kaum. Städte mit viel LED-Beleuchtung sind darum eher heller, als die Schätzung sagt." : "The satellite barely sees the blue light of white LEDs, so cities with a lot of LED lighting are, if anything, brighter than the estimate says."}</li>
            </>
          ) : (
            <li>{de ? "Die Stadt legt nur fest, welche Sterne gerade über dem Horizont stehen. Wie hell es bei dir ist, bestimmt allein die gewählte Wohnlage." : "The city only sets which stars are above the horizon. How bright your sky is depends on the setting you choose, nothing else."}</li>
          )}
        </ul>
        <a className="text-link" href={localizedLinks.destinations(locale)}>{de ? "Alle Reiseziele für dunkle Himmel →" : "All destinations for dark skies →"}</a>
      </section>
    </main>
  );
}
