import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Bawaan eslint-config-next.
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vanilla, dijalankan di browser lewat import() dan diuji oleh tests/.
    // Aturan React/TSX tidak berlaku di sini dan hasilnya cuma derau.
    "components/portfolio-runtime.js",
  ]),
  {
    /* lanyard.tsx adalah salinan komponen Lanyard Vercel/React Bits, sengaja
       dipertahankan sedekat mungkin dengan sumbernya (lihat komentar di
       kepalanya). Ref rapier memang bertipe any di sana, texture.wrapS memang
       dimutasi, dan onReady memang dipanggil dari efek sekali-jalan. Menulis
       ulang semuanya agar lolos aturan ini berarti membuat versi sendiri yang
       bisa berbeda perilakunya — persis yang ingin dihindari.

       Berkas tipe meshline juga any: paket meshline tidak membawa tipe untuk
       elemen JSX-nya, dan itulah alasan shim ini ada. */
    files: ["components/lanyard.tsx", "types/react-three-fiber.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
]);

export default eslintConfig;
