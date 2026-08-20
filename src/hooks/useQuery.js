"use client";

import { useEffect, useState } from "react";

/**
 * Reads URL query params on the client without `useSearchParams`, which keeps
 * pages free of extra Suspense boundaries during static prerender.
 */
export function useQuery() {
  const [params, setParams] = useState({});

  useEffect(() => {
    const read = () => {
      const out = {};
      new URLSearchParams(window.location.search).forEach((v, k) => {
        out[k] = v;
      });
      setParams(out);
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  return params;
}

export function useQueryParam(key, fallback = null) {
  const params = useQuery();
  return params[key] ?? fallback;
}
