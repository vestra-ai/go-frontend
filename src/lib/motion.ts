/** `"smooth"` unless the OS asks for reduced motion; CSS `scroll-behavior` can't override an explicit JS behaviour. */
export const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
