import assert from "node:assert/strict";
import test from "node:test";

import { createSchemaValidator, readPublishedManifest, schemaFiles } from "../scripts/validate/validate-schemas.js";

test("all public schema files register with Ajv", () => {
  const ajv = createSchemaValidator();
  for (const fileName of schemaFiles) {
    assert.ok(fileName.endsWith(".schema.json"));
  }
  assert.ok(ajv.getSchema("https://stargazing.local/schema/manifest.json"));
  assert.ok(ajv.getSchema("https://stargazing.local/schema/darkness-calibration.json"));
});

test("the committed manifest satisfies the manifest contract", () => {
  const ajv = createSchemaValidator();
  const validate = ajv.getSchema("https://stargazing.local/schema/manifest.json");
  assert.ok(validate);
  assert.equal(validate(readPublishedManifest()), true, JSON.stringify(validate.errors));
});

test("manifest validation rejects unknown fields", () => {
  const ajv = createSchemaValidator();
  const validate = ajv.getSchema("https://stargazing.local/schema/manifest.json");
  assert.ok(validate);
  const invalid = { ...readPublishedManifest() as Record<string, unknown>, unexpected: true };
  assert.equal(validate(invalid), false);
  assert.ok(validate.errors?.some((error) => error.keyword === "additionalProperties"));
});
