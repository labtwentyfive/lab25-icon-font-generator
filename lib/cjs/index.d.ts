type Meta = {
    id: string;
    name: string;
    codepoint: string;
    aliases: string[];
    tags: string[];
    author: string;
    version: string;
    custom?: boolean;
};
type FontBuild = Record<string, any> & {
    fontName: string;
    fontFamily: string;
    fontWeight: string;
    fileName: string;
    version: {
        major: string;
        minor: string;
        patch: string;
    };
};
type BuilderConfig = {
    paths: {
        custom: {
            svgs: string;
        };
        dist: {
            font: string;
            variables: string;
        };
        scanner: {
            dir: string;
            extensions: string;
        };
    };
};
export default class {
    paths: {
        dist: {
            font: string;
            variables: string;
        };
        mdi: {
            meta: string;
            fontbuild: string;
            svgs: string;
        };
        custom: {
            svgs: string;
        };
        scanner: {
            dir: string;
            extensions: string;
        };
    };
    fontbuild: FontBuild;
    meta: Meta[];
    icons: string[];
    constructor(config: BuilderConfig);
    get version(): string;
    get webfontConfig(): {
        files: string[];
        fontName: string;
        formats: string[];
        fontHeight: number;
        descent: number;
        normalize: boolean;
        centerHorizontally: boolean;
        version: string;
        svgicons2svgfont: {
            fontHeight: number;
            descent: number;
            normalize: boolean;
            centerHorizontally: boolean;
        };
    };
    initialize(): Promise<void>;
    scan(): Promise<void>;
    build(): Promise<unknown>;
    private initialize_build;
    private check_svg_naming;
    private compile;
    private generateVariablesSCSS;
}
export {};
