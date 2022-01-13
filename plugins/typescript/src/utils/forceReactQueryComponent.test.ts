import { petstore } from "../fixtures/petstore";
import { forceReactQueryComponent } from "./forceReactQueryComponent";

describe("forceReactQueryComponent", () => {
  it("should add the extension to the targeted operationId", () => {
    const updatedOpenAPIDocument = forceReactQueryComponent({
      openAPIDocument: petstore,
      component: "useMutate",
      operationId: "findPets",
    });

    expect(
      updatedOpenAPIDocument.paths["/pets"].get["x-openapi-codegen-component"]
    ).toBe("useMutate");
  });
  it("should throw if the operationId is not found", () => {
    expect(() =>
      forceReactQueryComponent({
        openAPIDocument: petstore,
        component: "useMutate",
        operationId: "notFound",
      })
    ).toThrowError(
      `[forceReactQueryComponent] Operation with the operationId "notFound" not found`
    );
  });

  it("should not mutate the original openAPIDocument", () => {
    const originalDocument = petstore;
    forceReactQueryComponent({
      openAPIDocument: originalDocument,
      component: "useMutate",
      operationId: "findPets",
    });

    expect(
      originalDocument.paths["/pets"].get["x-openapi-codegen-component"]
    ).toBeUndefined();
  });
});
