import {
  assertProductionDeploymentEnv,
  parseServerEnv,
} from "../lib/env/schema.ts";

try {
  const env = parseServerEnv(process.env);
  assertProductionDeploymentEnv(env);
  process.stdout.write(
    "Production environment contract passed (values were not printed).\n",
  );
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : "Production environment validation failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
