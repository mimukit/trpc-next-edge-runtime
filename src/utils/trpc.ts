import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import type { AppRouter } from "../pages/api/trpc/[trpc]";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    // In the browser, we return a relative URL
    return "";
  }
  // When rendering on the server, we return an absolute URL

  // reference for vercel.com
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: getBaseUrl() + "/api/trpc",
        }),
      ],
    };
  },
  ssr: true,
  responseMeta({ ctx, clientErrors }) {
    if (clientErrors.length) {
      // propagate http first error from API calls
      return {
        status: clientErrors[0].data?.httpStatus ?? 500,
      };
    }
    // cache request for 1 day + revalidate once every second
    const ONE_DAY_IN_SECONDS = 60;
    return {
      headers: {
        "cache-control": `s-maxage=1, stale-while-revalidate=${ONE_DAY_IN_SECONDS}`,
      },
    };
  },
});
