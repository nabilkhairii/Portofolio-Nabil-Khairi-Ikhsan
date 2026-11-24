import type { NextConfig } from "next";
import { CV_ASSET_URL, CV_DOWNLOAD_URL, CV_FILENAME } from "./lib/cv";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: CV_DOWNLOAD_URL,
      headers: [{ key: 'Content-Disposition', value: `attachment; filename="${CV_FILENAME}"` }],
    }];
  },
  rewrites() {
    // URL tanpa ekstensi menjaga unduhan dari intersepsi IDM atas tautan PDF.
    return [{ source: CV_DOWNLOAD_URL, destination: CV_ASSET_URL }];
  },
};

export default nextConfig;
