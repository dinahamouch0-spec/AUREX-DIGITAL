// Optional local S3-compatible server for developing/testing photo
// uploads without a real cloud storage account. NOT for production —
// point STORAGE_ENDPOINT at a real provider (S3/R2/B2) for deployment.
import S3rver from "s3rver";
import { mkdirSync } from "node:fs";

const PORT = 4569;
const BUCKET = process.env.STORAGE_BUCKET || "ya7kayti-uploads";
const dataDir = new URL("../.s3rver-data", import.meta.url).pathname;

mkdirSync(`${dataDir}/${BUCKET}`, { recursive: true });

new S3rver({
  port: PORT,
  address: "localhost",
  silent: false,
  directory: dataDir,
  configureBuckets: [{ name: BUCKET, configs: [] }],
}).run((err, { address, port } = {}) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`s3rver running at http://${address}:${port} (bucket: ${BUCKET})`);
});
