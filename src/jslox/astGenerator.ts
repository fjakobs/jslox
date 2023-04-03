/* eslint-disable @typescript-eslint/naming-convention */
const grammar: Record<string, Array<string>> = {
    Binary: ["Expr left", "Token operator", "Expr right"],
    Grouping: ["Expr expression"],
    Literal: ["string|number|null|boolean value"],
    Unary: ["Token operator", "Expr right"],
};

const header = `import { Token } from "./Token";

export interface Expr {
    visit<R>(visitor: Visitor<R>): R;
}

`;

function getClassSource(className: string, fields: Array<string>) {
    fields = fields.map((f) => {
        const [type, name] = f.split(" ");
        return `readonly ${name}: ${type}`;
    });

    return `export class ${className} implements Expr {
    constructor(${fields.join(", ")}) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visit${className}(this);
    }
}

`;
}

function getVisitorSource(classNames: Array<string>) {
    return `export interface Visitor<R> {
${classNames.map((c) => `    visit${c}(${c.toLowerCase()}: ${c}): R;`).join("\n")}
}

`;
}

async function main() {
    let source = header;

    const classNames = Object.keys(grammar);

    source += getVisitorSource(classNames);

    for (const className of classNames) {
        const fields = grammar[className];
        source += getClassSource(className, fields);
    }

    console.log(source);
}

if (require.main === module) {
    main();
}
