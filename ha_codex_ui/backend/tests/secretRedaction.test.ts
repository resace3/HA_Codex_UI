import { hasSecretLikeValue, redactSecrets } from "../src/security/secretRedaction.js";

describe("secretRedaction", () => {
  it("redacts OpenAI-like keys and tokens", () => {
    const input = "token sk-abcdefghijklmnopqrstuvwxyz123456 access_token=very-secret-value";
    expect(hasSecretLikeValue(input)).toBe(true);
    expect(redactSecrets(input)).not.toContain("very-secret-value");
  });
});
