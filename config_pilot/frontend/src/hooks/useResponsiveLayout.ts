import { useEffect, useState } from "react";

export function useResponsiveLayout(): "desktop" | "mobile" {
  const [layout, setLayout] = useState<"desktop" | "mobile">(() => (window.matchMedia("(max-width: 820px)").matches ? "mobile" : "desktop"));
  useEffect(() => {
    const media = window.matchMedia("(max-width: 820px)");
    const listener = () => setLayout(media.matches ? "mobile" : "desktop");
    listener();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return layout;
}
