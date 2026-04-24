/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// LibreTranslate API implementation
// Note: We use the public instance which may have rate limits.
// For production, consider a private instance or an API key.

export async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  // If same language or empty, return original
  if (!text.trim() || !fromLang || !toLang || fromLang.toLowerCase() === toLang.toLowerCase()) {
    return text;
  }

  const libreMirrors = [
    "https://translate.argosopentech.com/translate",
    "https://libretranslate.de/translate",
    "https://translate.terraprint.co/translate",
    "https://libretranslate.org/translate",
    "https://translate.fortuna-it.com/translate"
  ];

  // Strategy 1: Try LibreTranslate mirrors
  for (const mirror of libreMirrors) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); 

      const res = await fetch(mirror, {
        method: "POST",
        body: JSON.stringify({
          q: text,
          source: fromLang.toLowerCase(),
          target: toLang.toLowerCase(),
          format: "text"
        }),
        headers: { 
          "Content-Type": "application/json"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.translatedText) {
          console.info(`Translated via ${mirror}`);
          return data.translatedText;
        }
      }
    } catch (e) {
      console.warn(`Libre ${mirror} failed`);
    }
  }

  // Strategy 2: Absolute Fallback - Google Translate (GTX)
  // This is a common public fallback that is extremely reliable
  try {
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(googleUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        console.info("Translated via Google Fallback");
        return data[0][0][0];
      }
    }
  } catch (e) {
    console.error("Google fallback also failed:", e);
  }

  console.error("All translation strategies failed. Returning original text.");
  return text; 
}
