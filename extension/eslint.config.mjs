// @ts-check
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tseslint.parser,
            ecmaVersion: 2022,
            sourceType: "module",
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },
        rules: {
            "@typescript-eslint/naming-convention": ["warn", {
                selector: "import",
                format: ["camelCase", "PascalCase"],
            }],
            "@typescript-eslint/only-throw-error": "warn",
            curly: "warn",
            eqeqeq: "warn",
            semi: "warn",
        },
    }
);