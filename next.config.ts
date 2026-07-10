import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Op machines met TLS-onderschepping (antivirus, bedrijfsproxy) vertrouwt Node
    // het certificaat niet dat zo'n tussenlaag aanbiedt, terwijl Windows dat wél
    // doet. Zonder deze optie faalt het downloaden van Google Fonts tijdens dev
    // en build met UNABLE_TO_VERIFY_LEAF_SIGNATURE.
    //
    // De runtime-fetches naar Supabase lossen we hiermee niet op — die draaien in
    // Node zelf. Daarvoor start het dev-script Node met --use-system-ca.
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
