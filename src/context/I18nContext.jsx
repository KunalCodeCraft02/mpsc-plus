"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "@/locales/en";
import mr from "@/locales/mr";

const DICTS = { en, mr };
const STORAGE_KEY = "mpscpulse.lang";

const I18nContext = createContext(null);

function resolve(dict, path) {
  return path.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), dict);
}

export function I18nProvider({ children, initialLang = "en" }) {
  const [lang, setLang] = useState(initialLang);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && DICTS[saved]) setLang(saved);
    } catch {
      /* storage unavailable */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang === "mr" ? "mr" : "en";
  }, [lang, ready]);

  const t = useCallback(
    (path, vars) => {
      const dict = DICTS[lang] || en;
      let out = resolve(dict, path);
      if (out == null) out = resolve(en, path);
      if (out == null) return path;
      if (typeof out === "string" && vars) {
        return out.replace(/\{(\w+)\}/g, (_, k) =>
          vars[k] != null ? String(vars[k]) : `{${k}}`,
        );
      }
      return out;
    },
    [lang],
  );

  /** Pick localized field from a content record, e.g. tf(course, "title"). */
  const tf = useCallback(
    (obj, field) => {
      if (!obj) return "";
      if (lang === "mr") {
        const mrField = `${field}Mr`;
        if (obj[mrField]) return obj[mrField];
      }
      return obj[field] || "";
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, tf, ready, isMr: lang === "mr" }),
    [lang, t, tf, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
