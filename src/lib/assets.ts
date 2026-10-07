// Image map (PLAN.md §12.3). Placeholders are tinted SVGs; swap files in place (keep key + dimensions).
export type Asset = { src: string; width: number; height: number; alt: string };

const img = (src: string, width: number, height: number, alt = ""): Asset => ({ src, width, height, alt });

export const assets = {
  goMascot: img("/images/go-mascot.svg", 80, 182, "Go, a waving traveller holding a map"),
  goAvatar: img("/images/go-avatar.svg", 96, 96, "Go"),
  avatars: {
    aarav: img("/images/avatars/aarav.svg", 128, 128, "Aarav"),
    rahul: img("/images/avatars/rahul.svg", 128, 128, "Rahul"),
    priya: img("/images/avatars/priya.svg", 128, 128, "Priya"),
    arjun: img("/images/avatars/arjun.svg", 128, 128, "Arjun"),
    kabir: img("/images/avatars/kabir.svg", 128, 128, "Kabir"),
  },
  illustrations: {
    goa: img("/images/illustrations/goa.svg", 152, 152, "Goa"),
    coorg: img("/images/illustrations/coorg.svg", 152, 152, "Coorg"),
    gokarna: img("/images/illustrations/gokarna.svg", 152, 152, "Gokarna beach hut"),
    jaipur: img("/images/illustrations/jaipur.svg", 152, 152, "Jaipur pink palace"),
    pondy: img("/images/illustrations/pondy.svg", 152, 152, "Pondicherry"),
    hampi: img("/images/illustrations/hampi.svg", 152, 152, "Hampi"),
    manali: img("/images/illustrations/manali.svg", 152, 152, "Manali snowy cottage"),
    kerala: img("/images/illustrations/kerala.svg", 152, 152, "Kerala houseboat"),
    udaipur: img("/images/illustrations/udaipur.svg", 152, 152, "Udaipur lake palace"),
    ladakh: img("/images/illustrations/ladakh.svg", 152, 152, "Ladakh monastery"),
  },
  photos: {
    goaBeach: img("/images/photos/goa-beach.svg", 800, 600, "Goa beach"),
    goaSunset: img("/images/photos/goa-sunset.svg", 840, 500, "Palm silhouette against a Goa sunset over the sea"),
    villaSol: img("/images/photos/villa-sol.svg", 480, 270, "Villa Sol"),
    casaAzul: img("/images/photos/casa-azul.svg", 480, 270, "Casa Azul"),
    thePalms: img("/images/photos/the-palms.svg", 480, 270, "The Palms"),
    chaporaFort: img("/images/photos/chapora-fort.svg", 120, 120, "Chapora Fort"),
    dayFri: img("/images/photos/day-fri.svg", 240, 124),
    daySat: img("/images/photos/day-sat.svg", 240, 124),
    daySun: img("/images/photos/day-sun.svg", 240, 124),
    dayMon: img("/images/photos/day-mon.svg", 240, 124),
    goaPin: img("/images/photos/goa-pin.svg", 72, 72), // placeholder is its own file; design reuses goa-beach
  },
  indigo: img("/icons/brand/indigo.svg", 96, 28, "IndiGo"),
  airIndia: img("/icons/brand/air-india.svg", 120, 28, "Air India"),
} as const;
