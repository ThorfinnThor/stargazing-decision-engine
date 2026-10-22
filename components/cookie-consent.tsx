"use client";

import { useEffect, useState } from "react";

import type { Locale } from "@/lib/i18n/config";
import { localizedLinks } from "@/lib/i18n/links";
import { disableGoogleAnalytics, loadGoogleAnalytics, openConsentEvent, readConsent, storeConsent, type ConsentChoice } from "@/lib/analytics/consent";

export function CookieConsent({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const de = locale === "de";

  useEffect(() => {
    const stored = readConsent();
    if (stored === "granted") loadGoogleAnalytics();
    else if (stored === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(openConsentEvent, reopen);
    return () => window.removeEventListener(openConsentEvent, reopen);
  }, []);

  function choose(choice: ConsentChoice) {
    storeConsent(choice);
    if (choice === "granted") loadGoogleAnalytics();
    else disableGoogleAnalytics();
    setOpen(false);
  }

  if (!open) return null;
  return (
    <section className="cookie-consent" role="dialog" aria-modal="false" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-text" lang={locale}>
      <p id="cookie-consent-title" className="cookie-consent-title">{de ? "Reichweitenmessung" : "Audience measurement"}</p>
      <p id="cookie-consent-text">{de
        ? "Mit deiner Einwilligung nutzen wir Google Analytics 4, um anonymisierte Besuchszahlen auszuwerten. Dabei werden Cookies gesetzt und Daten an Google übermittelt, auch in die USA. Ohne Einwilligung wird Google Analytics nicht geladen. Du kannst deine Wahl jederzeit über „Cookie-Einstellungen“ im Footer ändern."
        : "With your consent we use Google Analytics 4 to measure how many people visit. This sets cookies and transfers data to Google, including to the United States. Without consent, Google Analytics is not loaded. You can change your choice at any time via “Cookie settings” in the footer."}{" "}
        <a href={`${localizedLinks.privacy(locale)}#privacy-analytics-title`}>{de ? "Mehr in der Datenschutzerklärung" : "Details in the privacy policy"}</a>
      </p>
      <div className="cookie-consent-actions">
        <button type="button" onClick={() => choose("denied")}>{de ? "Ablehnen" : "Decline"}</button>
        <button type="button" onClick={() => choose("granted")}>{de ? "Akzeptieren" : "Accept"}</button>
      </div>
    </section>
  );
}

export function CookieSettingsButton({ locale }: { locale: Locale }) {
  return (
    <button type="button" className="cookie-settings-link" onClick={() => window.dispatchEvent(new Event(openConsentEvent))}>
      {locale === "de" ? "Cookie-Einstellungen" : "Cookie settings"}
    </button>
  );
}
