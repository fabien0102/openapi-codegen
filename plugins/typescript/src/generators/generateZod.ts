import * as c from "case";
import { GenerateProps, generate } from "ts-to-zod";
import { ConfigBase, Context } from "../generators/types";

export type Config = ConfigBase & {
    /**
     * Generated files paths from `generateSchemaTypes`
     */
    schemasFiles: {
        requestBodies: string;
        schemas: string;
        parameters: string;
        responses: string;
    };
    generateProps?: GenerateProps;
    writeInferredTypes?: boolean
    writeIntegrationTests?: boolean
};

export const generateZod = async (context: Context, config: Config) => {
    const result = generate({
        sourceText: await context.readFile(config.schemasFiles.schemas + ".ts"),
        ...config.generateProps,
    })

    const filenamePrefix =
        c.snake(config.filenamePrefix ?? context.openAPIDocument.info.title) + "-";

    const formatFilename = config.filenameCase ? c[config.filenameCase] : c.camel;

    const zodFiles = {
        schemas: formatFilename(filenamePrefix + "-zod-schemas"),
        inferredTypes: formatFilename(filenamePrefix + "-zod-inferred-types"),
        integrationTests: formatFilename(filenamePrefix + "-zod-integration-tests"),
    }

    if (result.errors.length === 0) {
        await context.writeFile(zodFiles.schemas + ".ts", result.getZodSchemasFile("./" + config.schemasFiles.schemas));

        if (config.writeInferredTypes !== false) {
            await context.writeFile(zodFiles.inferredTypes + ".ts", result.getInferredTypes("./" + zodFiles.schemas));

            if (config.writeIntegrationTests !== false) {
                await context.writeFile(zodFiles.integrationTests + ".ts", result.getIntegrationTestFile("./" + zodFiles.inferredTypes, "./" + zodFiles.schemas));
            }
        }
    } else {
        console.log(`⚠️ Zod Generate finished with errors!`, result.errors);
    }

    return zodFiles
}
