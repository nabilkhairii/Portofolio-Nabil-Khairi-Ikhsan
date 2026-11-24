import type { NextConfig } from "next";
import { CV_ASSET_URL, CV_DOWNLOAD_URL } from "./lib/cv";

const nextConfig: NextConfig = {
  rewrites() {
    // URL tanpa ekstensi menjaga unduhan dari intersepsi IDM atas tautan PDF.
    return [{ source: CV_DOWNLOAD_URL, destination: CV_ASSET_URL }];
  },
};

export default nextConfig;
