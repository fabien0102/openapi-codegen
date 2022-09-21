import ts, { factory as f } from "typescript";
import { print } from "../testUtils";
import { getUsedImports } from "./getUsedImports";

describe("getUsedImports", () => {
  it("should generate requestBodies import", () => {
    const nodes: ts.Node[] = [
      f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("A"),
        undefined,
        f.createTypeReferenceNode(
          f.createQualifiedName(
            f.createIdentifier("RequestBodies"), // this should be detected
            f.createIdentifier("B")
          ),
          undefined
        )
      ),
    ];

    expect(
      getUsedImports(nodes, {
        parameters: "./parameters",
        requestBodies: "./requestBodies",
        responses: "./responses",
        schemas: "./schemas",
        utils: "./utils",
      })
        .nodes.map(print)
        .join("\n")
    ).toMatchInlineSnapshot(
      `"import type * as RequestBodies from \\"././requestBodies\\";"`
    );
  });

  it("should generate schemas import", () => {
    const nodes: ts.Node[] = [
      f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("A"),
        undefined,
        f.createTypeReferenceNode(
          f.createQualifiedName(
            f.createIdentifier("Schemas"), // this should be detected
            f.createIdentifier("B")
          ),
          undefined
        )
      ),
    ];

    expect(
      getUsedImports(nodes, {
        parameters: "./parameters",
        requestBodies: "./requestBodies",
        responses: "./responses",
        schemas: "./schemas",
        utils: "./utils",
      })
        .nodes.map(print)
        .join("\n")
    ).toMatchInlineSnapshot(
      `"import type * as Schemas from \\"././schemas\\";"`
    );
  });

  it("should generate parameters import", () => {
    const nodes: ts.Node[] = [
      f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("A"),
        undefined,
        f.createTypeReferenceNode(
          f.createQualifiedName(
            f.createIdentifier("Parameters"), // this should be detected
            f.createIdentifier("B")
          ),
          undefined
        )
      ),
    ];

    expect(
      getUsedImports(nodes, {
        parameters: "./parameters",
        requestBodies: "./requestBodies",
        responses: "./responses",
        schemas: "./schemas",
        utils: "./utils",
      })
        .nodes.map(print)
        .join("\n")
    ).toMatchInlineSnapshot(
      `"import type * as Parameters from \\"././parameters\\";"`
    );
  });

  it("should generate responses import", () => {
    const nodes: ts.Node[] = [
      f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("A"),
        undefined,
        f.createTypeReferenceNode(
          f.createQualifiedName(
            f.createIdentifier("Responses"), // this should be detected
            f.createIdentifier("B")
          ),
          undefined
        )
      ),
    ];

    expect(
      getUsedImports(nodes, {
        parameters: "./parameters",
        requestBodies: "./requestBodies",
        responses: "./responses",
        schemas: "./schemas",
        utils: "./utils",
      })
        .nodes.map(print)
        .join("\n")
    ).toMatchInlineSnapshot(
      `"import type * as Responses from \\"././responses\\";"`
    );
  });

  it("should generate all imports", () => {
    const nodes: ts.Node[] = [
      f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("A"),
        undefined,
        f.createTypeReferenceNode(
          f.createQualifiedName(
            f.createIdentifier("RequestBodies"), // this should be detected
            f.createIdentifier("B")
          ),
          undefined
        )
      ),
      f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("A"),
        undefined,
        f.createTypeReferenceNode(
          f.createQualifiedName(
            f.createIdentifier("Schemas"), // this should be detected
            f.createIdentifier("B")
          ),
          undefined
        )
      ),
      f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("A"),
        undefined,
        f.createTypeReferenceNode(
          f.createQualifiedName(
            f.createIdentifier("Parameters"), // this should be detected
            f.createIdentifier("B")
          ),
          undefined
        )
      ),
      f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("A"),
        undefined,
        f.createTypeReferenceNode(
          f.createQualifiedName(
            f.createIdentifier("Responses"), // this should be detected
            f.createIdentifier("B")
          ),
          undefined
        )
      ),
    ];

    expect(
      getUsedImports(nodes, {
        parameters: "./parameters",
        requestBodies: "./requestBodies",
        responses: "./responses",
        schemas: "./schemas",
        utils: "./utils",
      })
        .nodes.map(print)
        .join("\n")
    ).toMatchInlineSnapshot(`
      "import type * as Parameters from \\"././parameters\\";
      import type * as Schemas from \\"././schemas\\";
      import type * as RequestBodies from \\"././requestBodies\\";
      import type * as Responses from \\"././responses\\";"
    `);
  });

  it("should generate utils import (ClientErrorStatus)", () => {
    const nodes = [
      f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("A"),
        undefined,
        f.createTypeReferenceNode(f.createIdentifier("ErrorWrapper"), [
          f.createTypeReferenceNode(
            f.createIdentifier("ClientErrorStatus"), // should be detected
            undefined
          ),
        ])
      ),
    ];

    expect(
      getUsedImports(nodes, {
        parameters: "./parameters",
        requestBodies: "./requestBodies",
        responses: "./responses",
        schemas: "./schemas",
        utils: "./utils",
      })
        .nodes.map(print)
        .join("\n")
    ).toMatchInlineSnapshot(
      `"import type { ClientErrorStatus } from \\"././utils\\";"`
    );
  });

  it("should generate utils import (ServerErrorStatus)", () => {
    const nodes = [
      f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("A"),
        undefined,
        f.createTypeReferenceNode(f.createIdentifier("ErrorWrapper"), [
          f.createTypeReferenceNode(
            f.createIdentifier("ServerErrorStatus"), // should be detected
            undefined
          ),
        ])
      ),
    ];

    expect(
      getUsedImports(nodes, {
        parameters: "./parameters",
        requestBodies: "./requestBodies",
        responses: "./responses",
        schemas: "./schemas",
        utils: "./utils",
      })
        .nodes.map(print)
        .join("\n")
    ).toMatchInlineSnapshot(
      `"import type { ServerErrorStatus } from \\"././utils\\";"`
    );
  });

  it("should generate utils import (ServerErrorStatus & ClientErrorStatus)", () => {
    const nodes = [
      f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("A"),
        undefined,
        f.createTypeReferenceNode(f.createIdentifier("ErrorWrapper"), [
          f.createTypeReferenceNode(
            f.createIdentifier("ServerErrorStatus"), // should be detected
            undefined
          ),
        ])
      ),
      f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("A"),
        undefined,
        f.createTypeReferenceNode(f.createIdentifier("ErrorWrapper"), [
          f.createTypeReferenceNode(
            f.createIdentifier("ClientErrorStatus"), // should be detected
            undefined
          ),
        ])
      ),
    ];

    expect(
      getUsedImports(nodes, {
        parameters: "./parameters",
        requestBodies: "./requestBodies",
        responses: "./responses",
        schemas: "./schemas",
        utils: "./utils",
      })
        .nodes.map(print)
        .join("\n")
    ).toMatchInlineSnapshot(
      `"import type { ServerErrorStatus, ClientErrorStatus } from \\"././utils\\";"`
    );
  });
});
