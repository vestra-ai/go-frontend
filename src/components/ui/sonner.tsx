"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

// Rendered inside the overlay layer (see AppFrame), so sonner's position:fixed is relative to the 450px column.
// Offsets are objects: a bare number would also set left/right to 108px on mobile.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-center"
      offset={{ bottom: 108 }}
      mobileOffset={{ bottom: 108, left: 0, right: 0 }}
      duration={2200}
      visibleToasts={1}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "inset-x-0 mx-auto w-fit! max-w-[min(340px,calc(100%-32px))] rounded-3xl bg-ink px-4 py-3 text-center font-sans text-14 leading-[1.35] font-semibold text-white shadow-toast transition-all duration-220 starting:translate-y-1.5 starting:opacity-0",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
