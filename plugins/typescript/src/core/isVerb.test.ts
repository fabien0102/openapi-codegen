import { isVerb } from "./isVerb";

describe("isVerb", () => {
  [
    { verb: "get", expected: true },
    { verb: "post", expected: true },
    { verb: "patch", expected: true },
    { verb: "put", expected: true },
    { verb: "delete", expected: true },
    { verb: "header", expected: false },
  ].forEach(({ verb, expected }) =>
    it(`should return ${expected} for the verb "${verb}"`, () =>
      expect(isVerb(verb)).toBe(expected))
  );
});
