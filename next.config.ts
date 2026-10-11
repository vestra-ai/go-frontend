import { withSerwist } from "@serwist/turbopack";
import { OPTIMIZED_IMAGE_HOSTS, OPTIMIZED_IMAGE_PATH } from "./src/lib/imageHosts";

export default withSerwist({
  reactStrictMode: true,
  images: {
    // The app is a column at most 450px wide (AppFrame), so no image needs more than ~1080px even at 2.5x. The default
    // list runs to 3840 and a 3x phone would pick the 1920 one: about four times the bytes for the same picture.
    deviceSizes: [640, 750, 828, 1080],
    remotePatterns: OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: `${OPTIMIZED_IMAGE_PATH}**`,
      search: "",
    })),
  },
});
