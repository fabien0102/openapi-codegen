/* eslint-disable @typescript-eslint/no-explicit-any */
/* oxlint-disable typescript/no-explicit-any, no-explicit-any */
import * as ast from "typescript/ast";
import * as rawFactory from "typescript/ast/factory";
import * as is from "typescript/ast/is";
import { API } from "typescript/sync";

export * from "typescript/ast";
export * from "typescript/ast/is";

export enum EmitHint {
  SourceFile = 0,
  Title = 1,
  Unspecified = 2,
  Expression = 3,
  IdentifierName = 4,
  MappedTypeToken = 5,
  EmbeddedStatement = 6,
  JsxAttributeValue = 7,
}

export enum NewLineKind {
  CarriageReturnLineFeed = 0,
  LineFeed = 1,
}

let sharedApi: API | undefined;
function getApi(): API {
  if (!sharedApi) {
    sharedApi = new API();
  }
  return sharedApi;
}

export const factory = {
  ...rawFactory,
  createModifier(kind: any) {
    return rawFactory.createToken(kind);
  },
  createFalse() {
    return rawFactory.createToken(ast.SyntaxKind.FalseKeyword);
  },
  createTrue() {
    return rawFactory.createToken(ast.SyntaxKind.TrueKeyword);
  },
  createNull() {
    return rawFactory.createToken(ast.SyntaxKind.NullKeyword);
  },
  createParenthesizedType(type: any) {
    return rawFactory.createParenthesizedTypeNode(type);
  },
  createTypeReferenceNode(typeName: any, typeArguments?: any) {
    let nameNode = typeName;
    if (typeof typeName === "string") {
      const parts = typeName.split(".");
      nameNode = rawFactory.createIdentifier(parts[0]);
      for (let i = 1; i < parts.length; i++) {
        nameNode = rawFactory.createQualifiedName(
          nameNode,
          rawFactory.createIdentifier(parts[i])
        );
      }
    }
    return rawFactory.createTypeReferenceNode(nameNode, typeArguments);
  },
  createIdentifier(text: string) {
    const node = rawFactory.createIdentifier(text);
    Object.defineProperty(node, "escapedText", {
      get() {
        return text;
      },
      configurable: true,
    });
    return node;
  },
  createNumericLiteral(value: any, tokenFlags?: any) {
    return rawFactory.createNumericLiteral(String(value), tokenFlags ?? 0);
  },
  createStringLiteral(text: any, isSingleQuote?: boolean) {
    return rawFactory.createStringLiteral(
      String(text),
      (isSingleQuote ? 1 : 0) as any
    );
  },
  createPropertyAssignment(
    nameOrModifiers: any,
    initializerOrName: any,
    postfixToken?: any,
    type?: any,
    initializer?: any
  ) {
    if (initializer !== undefined) {
      return rawFactory.createPropertyAssignment(
        nameOrModifiers,
        initializerOrName,
        postfixToken,
        type,
        initializer
      );
    }
    const name =
      typeof nameOrModifiers === "string"
        ? rawFactory.createIdentifier(nameOrModifiers)
        : nameOrModifiers;
    const init = initializerOrName;
    return rawFactory.createPropertyAssignment(
      undefined,
      name,
      undefined,
      undefined as any,
      init
    );
  },
  createShorthandPropertyAssignment(
    nameOrModifiers: any,
    initializerOrName?: any
  ) {
    const name =
      typeof nameOrModifiers === "string"
        ? rawFactory.createIdentifier(nameOrModifiers)
        : nameOrModifiers;
    const init = initializerOrName;
    return rawFactory.createShorthandPropertyAssignment(
      undefined,
      name,
      undefined,
      undefined as any,
      undefined,
      init
    );
  },
  createBinaryExpression(
    leftOrModifiers: any,
    operatorOrLeft: any,
    rightOrType?: any,
    operatorToken?: any,
    right?: any
  ) {
    if (right !== undefined) {
      return rawFactory.createBinaryExpression(
        leftOrModifiers,
        operatorOrLeft,
        rightOrType,
        operatorToken,
        right
      );
    }
    const left = leftOrModifiers;
    const operator =
      typeof operatorOrLeft === "number"
        ? rawFactory.createToken(operatorOrLeft)
        : operatorOrLeft;
    const rightNode = rightOrType;
    return rawFactory.createBinaryExpression(
      undefined,
      left,
      undefined,
      operator,
      rightNode
    );
  },
  createVariableDeclarationList(declarations: any, flags?: any) {
    return rawFactory.createVariableDeclarationList(declarations, flags ?? 0);
  },
  createTypeParameterDeclaration(
    arg1: any,
    arg2?: any,
    arg3?: any,
    arg4?: any
  ) {
    let modifiers: any;
    let name: any;
    let constraint: any;
    let defaultType: any;

    if (typeof arg1 === "string" || arg1?.kind === ast.SyntaxKind.Identifier) {
      modifiers = undefined;
      name = arg1;
      constraint = arg2;
      defaultType = arg3;
    } else {
      modifiers = arg1;
      name = arg2;
      constraint = arg3;
      defaultType = arg4;
    }

    const nameIdent =
      typeof name === "string" ? rawFactory.createIdentifier(name) : name;
    return rawFactory.createTypeParameterDeclaration(
      modifiers,
      nameIdent,
      constraint,
      undefined,
      defaultType
    );
  },
  createParameterDeclaration(
    modifiers: any,
    dotDotDotToken: any,
    name: any,
    questionToken?: any,
    type?: any,
    initializer?: any
  ) {
    const ident =
      typeof name === "string" ? rawFactory.createIdentifier(name) : name;
    return rawFactory.createParameterDeclaration(
      modifiers,
      dotDotDotToken,
      ident,
      questionToken,
      type,
      initializer
    );
  },
  createPropertySignature(
    modifiers: any,
    name: any,
    questionToken: any,
    type: any
  ) {
    const ident =
      typeof name === "string" ? rawFactory.createIdentifier(name) : name;
    return rawFactory.createPropertySignatureDeclaration(
      modifiers,
      ident,
      questionToken,
      type,
      undefined as any
    );
  },
  createTypeAliasDeclaration(
    modifiers: any,
    name: any,
    typeParameters: any,
    type: any
  ) {
    const ident =
      typeof name === "string" ? rawFactory.createIdentifier(name) : name;
    return rawFactory.createTypeAliasDeclaration(
      modifiers,
      ident,
      typeParameters,
      type
    );
  },
  createInterfaceDeclaration(
    modifiers: any,
    name: any,
    typeParameters: any,
    heritageClauses: any,
    members: any
  ) {
    const ident =
      typeof name === "string" ? rawFactory.createIdentifier(name) : name;
    return rawFactory.createInterfaceDeclaration(
      modifiers,
      ident,
      typeParameters,
      heritageClauses,
      members
    );
  },
  createEnumDeclaration(modifiers: any, name: any, members: any) {
    const ident =
      typeof name === "string" ? rawFactory.createIdentifier(name) : name;
    return rawFactory.createEnumDeclaration(modifiers, ident, members);
  },
  createEnumMember(name: any, initializer?: any) {
    const ident =
      typeof name === "string" ? rawFactory.createIdentifier(name) : name;
    return rawFactory.createEnumMember(ident, initializer);
  },
  createFunctionDeclaration(
    modifiers: any,
    asteriskToken: any,
    name: any,
    typeParameters: any,
    parameters: any,
    type: any,
    body: any
  ) {
    const ident =
      typeof name === "string" ? rawFactory.createIdentifier(name) : name;
    return rawFactory.createFunctionDeclaration(
      modifiers,
      asteriskToken,
      ident,
      typeParameters,
      parameters,
      type,
      body
    );
  },
  createIndexSignature(modifiers: any, parameters: any, type: any) {
    return rawFactory.createIndexSignatureDeclaration(
      modifiers,
      parameters,
      type
    );
  },
  createCallExpression(
    expression: any,
    typeArgumentsOrQuestionDotToken: any,
    argumentsArray?: any
  ) {
    if (argumentsArray !== undefined) {
      return rawFactory.createCallExpression(
        expression,
        undefined,
        typeArgumentsOrQuestionDotToken,
        argumentsArray,
        0
      );
    }
    if (Array.isArray(typeArgumentsOrQuestionDotToken)) {
      return rawFactory.createCallExpression(
        expression,
        undefined,
        undefined,
        typeArgumentsOrQuestionDotToken,
        0
      );
    }
    return rawFactory.createCallExpression(
      expression,
      undefined,
      typeArgumentsOrQuestionDotToken,
      [],
      0
    );
  },
  updateCallExpression(
    node: any,
    expression: any,
    typeArgsOrQuestionDot: any,
    argsOrTypeArgs?: any,
    args?: any
  ) {
    if (args !== undefined) {
      return rawFactory.updateCallExpression(
        node,
        expression,
        typeArgsOrQuestionDot,
        argsOrTypeArgs,
        args
      );
    }
    return rawFactory.updateCallExpression(
      node,
      expression,
      undefined,
      typeArgsOrQuestionDot,
      argsOrTypeArgs || []
    );
  },
  updateExportAssignment(
    node: any,
    modifiers: any,
    typeOrExpression: any,
    expression?: any
  ) {
    let updated: any;
    if (expression !== undefined) {
      updated = rawFactory.updateExportAssignment(
        node,
        modifiers,
        typeOrExpression,
        expression
      );
    } else {
      updated = rawFactory.updateExportAssignment(
        node,
        modifiers,
        undefined as any,
        typeOrExpression
      );
    }
    if (node.__leadingComments) {
      updated.__leadingComments = [...node.__leadingComments];
    }
    return updated;
  },
  createPropertyAccessExpression(
    expression: any,
    nameOrQuestionDotToken: any,
    name?: any
  ) {
    if (name !== undefined) {
      const ident =
        typeof name === "string" ? rawFactory.createIdentifier(name) : name;
      return rawFactory.createPropertyAccessExpression(
        expression,
        nameOrQuestionDotToken,
        ident,
        0
      );
    }
    const ident =
      typeof nameOrQuestionDotToken === "string"
        ? rawFactory.createIdentifier(nameOrQuestionDotToken)
        : nameOrQuestionDotToken;
    return rawFactory.createPropertyAccessExpression(
      expression,
      undefined,
      ident,
      0
    );
  },
  createArrowFunction(
    modifiers: any,
    typeParameters: any,
    parameters: any,
    type: any,
    equalsGreaterThanToken: any,
    body: any
  ) {
    const token =
      equalsGreaterThanToken ||
      rawFactory.createToken(ast.SyntaxKind.EqualsGreaterThanToken);
    return rawFactory.createArrowFunction(
      modifiers,
      typeParameters,
      parameters,
      type,
      token,
      body
    );
  },
  createImportClause(isTypeOnlyOrPhase: any, name: any, namedBindings: any) {
    let phase = isTypeOnlyOrPhase;
    let isTypeOnlyBool = false;
    if (typeof isTypeOnlyOrPhase === "boolean") {
      isTypeOnlyBool = isTypeOnlyOrPhase;
      phase = isTypeOnlyOrPhase ? ast.SyntaxKind.TypeKeyword : undefined;
    } else if (isTypeOnlyOrPhase === ast.SyntaxKind.TypeKeyword) {
      isTypeOnlyBool = true;
    }
    const clause = rawFactory.createImportClause(phase, name, namedBindings);
    Object.defineProperty(clause, "isTypeOnly", {
      get() {
        return isTypeOnlyBool;
      },
      configurable: true,
    });
    return clause;
  },
  createJSDocComment(comment?: any, tags?: any) {
    return {
      kind: 316,
      _isJSDoc: true,
      _commentText: typeof comment === "string" ? comment : "",
      _tags: tags || [],
    };
  },
  createJSDocPropertyTag(
    tagName: any,
    name: any,
    _isBracketed?: boolean,
    _typeExpression?: any,
    _isNameFirst?: boolean,
    _comment?: any
  ) {
    const tagNameStr =
      typeof tagName === "string"
        ? tagName
        : tagName?.text || tagName?._data?.text || "";
    const nameStr =
      typeof name === "string" ? name : name?.text || name?._data?.text || "";
    return {
      kind: 341,
      _tagName: tagNameStr,
      _name: nameStr,
      tagName:
        typeof tagName === "string"
          ? rawFactory.createIdentifier(tagName)
          : tagName,
      name: typeof name === "string" ? rawFactory.createIdentifier(name) : name,
    };
  },
};

function printJSDoc(node: any): string {
  const lines: string[] = ["/**"];
  const commentText = node._commentText || "";
  if (commentText) {
    for (const l of commentText.split("\n")) {
      if (l.trim()) {
        lines.push(" * " + l);
      } else {
        lines.push(" * ");
      }
    }
  }
  const tags = node._tags || [];
  for (const tag of tags) {
    lines.push(` * @${tag._tagName} ${tag._name}`);
  }
  lines.push(" */");
  return lines.join("\n");
}

function getTypeName(typeNode: any): string | undefined {
  if (!typeNode) return undefined;
  if (typeNode.kind === 150) return "number";
  if (typeNode.kind === 153) return "string";
  if (typeNode.kind === 136) return "boolean";
  if (typeNode.kind === 106) return "null";
  const tn = typeNode.typeName || typeNode._data?.typeName;
  if (tn) return tn.text || tn._data?.text;
  return undefined;
}

function collectInnerComments(root: any): any[] {
  const result: any[] = [];
  function visit(n: any) {
    if (!n) return;
    if (n.__leadingComments && n.__leadingComments.length > 0) {
      result.push(n);
    }
    if (n.forEachChild) {
      n.forEachChild((c: any) => {
        visit(c);
      });
    }
  }
  if (root?.forEachChild) {
    root.forEachChild((c: any) => {
      visit(c);
    });
  }
  return result;
}

function injectInnerComments(root: any, text: string): string {
  const nodes = collectInnerComments(root);
  if (nodes.length === 0) return text;

  const lines = text.split("\n");
  let lineIdx = 0;

  for (const node of nodes) {
    const name = node.name?.text || node.name?._data?.text;
    if (!name) continue;

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const expectedType = getTypeName(node.type || node._data?.type);
    const regex = expectedType
      ? new RegExp(
          `^(\\s*)(["']?)${escapedName}(["']?[?:;])\\s*${expectedType}`
        )
      : new RegExp(`^(\\s*)(["']?)${escapedName}(["']?[?:;])`);

    let matched = false;
    let fallbackIdx = -1;
    let fallbackIndent = "";

    for (let i = lineIdx; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(regex);
      if (match) {
        matched = true;
        lineIdx = i;
        break;
      }
      if (
        fallbackIdx === -1 &&
        line.match(new RegExp(`^(\\s*)(["']?)${escapedName}(["']?[?:;])`))
      ) {
        fallbackIdx = i;
        fallbackIndent = line.match(/^(\s*)/)?.[1] || "";
      }
    }

    const targetIdx = matched ? lineIdx : fallbackIdx;
    if (targetIdx !== -1) {
      const indent = matched
        ? lines[targetIdx].match(/^(\s*)/)?.[1] || ""
        : fallbackIndent;
      const commentLines: string[] = [];
      for (const c of node.__leadingComments) {
        const raw = ("/*" + c.text + "*/").trimEnd();
        const parts = raw.split("\n");
        for (let i = 0; i < parts.length; i++) {
          const trimmed = parts[i].trim();
          if (trimmed === "*") {
            commentLines.push(indent + " *");
          } else if (i === 0) {
            commentLines.push(indent + parts[i].trimEnd());
          } else {
            commentLines.push(indent + " " + parts[i].trimStart());
          }
        }
      }
      lines.splice(targetIdx, 0, ...commentLines);
      lineIdx = targetIdx + commentLines.length + 1;
    }
  }
  return lines.join("\n");
}

export function createPrinter(_options?: {
  newLine?: NewLineKind;
  removeComments?: boolean;
}) {
  const api = getApi();
  return {
    printNode(_hint: EmitHint, node: any, _sourceFile?: any) {
      if (node._isJSDoc || node.kind === 316) {
        return printJSDoc(node);
      }
      let printed = api.printer.printNode(node);
      if (node.__leadingComments && node.__leadingComments.length > 0) {
        let prefix = "";
        for (const c of node.__leadingComments) {
          if (c.isLineComment) {
            prefix += `${c.text}\n`;
          } else {
            prefix += `/*${c.text}*/` + (c.hasTrailingNewLine ? "\n" : " ");
          }
        }
        printed = prefix + printed;
      }
      printed = injectInnerComments(node, printed);
      return printed;
    },
    printFile(sourceFile: any) {
      let printed = api.printer.printFile(sourceFile);
      if (sourceFile?.statements) {
        for (const stmt of sourceFile.statements) {
          if (stmt.__leadingComments && stmt.__leadingComments.length > 0) {
            for (const c of stmt.__leadingComments) {
              if (c.isLineComment && !printed.includes(c.text)) {
                const stmtText = api.printer.printNode(stmt);
                const firstLine = stmtText.split("\n")[0].trim();
                const idx = printed.indexOf(firstLine);
                if (idx !== -1) {
                  printed =
                    printed.slice(0, idx) + c.text + "\n" + printed.slice(idx);
                }
              }
            }
          }
        }
      }
      printed = injectInnerComments(sourceFile, printed);
      return printed;
    },
  };
}

export function addSyntheticLeadingComment(
  node: any,
  kind: any,
  text: string,
  hasTrailingNewLine?: boolean
) {
  if (!node.__leadingComments) {
    node.__leadingComments = [];
  }
  node.__leadingComments.push({ kind, text, hasTrailingNewLine });
}

export function createScanner(
  _arg1?: any,
  _arg2?: any,
  _arg3?: any,
  textInitial?: string
) {
  let text = textInitial;
  if (typeof _arg3 === "string") {
    text = _arg3;
  } else if (typeof _arg1 === "string") {
    text = _arg1;
  }
  const scanner = ast.createScanner(false, 0, text);
  return {
    ...scanner,
    getTokenPos: () => scanner.getTokenStart(),
    scan: () => scanner.scan(),
    getToken: () => scanner.getToken(),
    getTokenText: () => scanner.getTokenText(),
    getTokenEnd: () => scanner.getTokenEnd(),
  };
}

let remoteNodePatched = false;
export function createSourceFile(
  fileName: string,
  sourceText: string,
  _languageVersion?: any,
  _setParentNodes?: boolean,
  _scriptKind?: any
) {
  const api = getApi();
  const retained = api.createSourceFile(fileName, sourceText);
  const sf = retained.sourceFile;
  if (sf?.statements) {
    const srcLines = sourceText.split("\n");
    const commentBuffer: string[] = [];
    let stmtIdx = 0;
    for (const line of srcLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("//")) {
        commentBuffer.push(trimmed);
      } else if (
        trimmed.length > 0 &&
        !trimmed.startsWith("/*") &&
        !trimmed.startsWith("*")
      ) {
        if (commentBuffer.length > 0 && stmtIdx < sf.statements.length) {
          const stmt = sf.statements[stmtIdx] as any;
          if (!stmt.__leadingComments) {
            stmt.__leadingComments = [];
          }
          for (const c of commentBuffer) {
            stmt.__leadingComments.push({
              kind: 2,
              text: c,
              isLineComment: true,
              hasTrailingNewLine: true,
            });
          }
          commentBuffer.length = 0;
        }
        stmtIdx++;
      }
    }
  }
  if (!remoteNodePatched && sf) {
    remoteNodePatched = true;
    const sample = sf.statements?.[0] || sf;
    const proto = Object.getPrototypeOf(sample);
    if (proto) {
      Object.defineProperty(proto, "escapedText", {
        get() {
          return this.text;
        },
        configurable: true,
      });
    }
  }
  return sf;
}

export function forEachChild(node: any, cb: (node: any) => any) {
  if (
    node?.statements &&
    (Array.isArray(node.statements) ||
      typeof node.statements[Symbol.iterator] === "function")
  ) {
    for (const stmt of node.statements) {
      if (!stmt) continue;
      const res = cb(stmt);
      if (res) return res;
    }
    return undefined;
  }
  if (typeof node?.forEachChild === "function") {
    return node.forEachChild((child: any) => {
      if (child && typeof child[Symbol.iterator] === "function") {
        for (const item of child) {
          if (!item) continue;
          const res = cb(item);
          if (res) return res;
        }
        return undefined;
      }
      return cb(child);
    });
  }
  return undefined;
}

export function transform(
  source: any,
  transformers: Array<(context: any) => (node: any) => any>
) {
  const nodes = Array.isArray(source) ? source : [source];
  const context = {
    factory,
    getCompilerOptions: () => ({}),
    hoistFunctionDeclaration: () => {},
    hoistVariableDeclaration: () => {},
  };
  const transformed = nodes.map((node) => {
    let current = node;
    for (const tf of transformers) {
      const visitor = tf(context);
      current = visitor(current);
    }
    return current;
  });
  return {
    transformed,
    dispose: () => {},
  };
}

export function visitEachChild(node: any, visitor: any, _context?: any) {
  return (ast as any).visitEachChild(node, visitor);
}

const tsCompat = {
  ...ast,
  ...is,
  factory,
  EmitHint,
  NewLineKind,
  addSyntheticLeadingComment,
  createPrinter,
  createScanner,
  createSourceFile,
  forEachChild,
  transform,
  visitEachChild,
};

namespace tsCompat {
  export type Node = any;
  export type TypeNode = ast.TypeNode | any;
  export type Identifier = ast.Identifier | any;
  export type ImportClause = ast.ImportClause | any;
  export type Statement = ast.Statement | any;
  export type Expression = ast.Expression | any;
  export type TypeAliasDeclaration = ast.TypeAliasDeclaration | any;
  export type PropertySignature = any;
  export type PropertyAssignment = any;
  export type EnumDeclaration = ast.EnumDeclaration | any;
  export type EnumMember = any;
  export type TypeElement = any;
  export type LiteralTypeNode = any;
  export type IndexSignatureDeclaration = any;
  export type TypeLiteralNode = any;
  export type SourceFile = ast.SourceFile | any;
  export type JSDoc = any;
  export type JSDocPropertyTag = any;
  export type SyntaxKind = ast.SyntaxKind;
  export type EmitHint = any;
  export type NewLineKind = any;
  export type Visitor = (node: any) => any;
  export type TransformerFactory<T extends ast.Node> = (
    context: any
  ) => (rootNode: T) => T;
}

export default tsCompat;
