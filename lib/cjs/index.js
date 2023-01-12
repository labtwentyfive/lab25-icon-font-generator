"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const fast_glob_1 = __importDefault(require("fast-glob"));
const readline_1 = require("readline");
const webfont_1 = __importDefault(require("webfont"));
const cwd = process.cwd();
const Helper = {
    readFileAndParse: (path) => __awaiter(void 0, void 0, void 0, function* () {
        const str = yield (0, promises_1.readFile)(path, { encoding: "utf-8" });
        return JSON.parse(str);
    }),
};
class default_1 {
    constructor(config) {
        this.paths = {
            dist: {
                font: "",
                variables: "",
            },
            mdi: {
                meta: (0, path_1.resolve)(cwd, "node_modules/@mdi/svg/meta.json"),
                fontbuild: (0, path_1.resolve)(cwd, "node_modules/@mdi/svg/font-build.json"),
                svgs: (0, path_1.resolve)(cwd, "node_modules/@mdi/svg/svg"),
            },
            custom: {
                svgs: "",
            },
            scanner: {
                dir: "",
                extensions: "",
            },
        };
        this.fontbuild = {
            fontName: "",
            fontFamily: "",
            fontWeight: "",
            fileName: "",
            version: {
                major: "0",
                minor: "0",
                patch: "0",
            },
        };
        this.meta = [];
        this.icons = [];
        this.generateVariablesSCSS = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const { fileName, fontName, fontFamily, fontWeight, version } = this.fontbuild;
                let template = `
      // DO NOT TOUCH. This file is auto generated via "yarn mdi:generate" and includes all icons found in the projects files
      // Make sure you always type the whole class name like "mdi-ABC", never make icons dynamic where you pass the icon without
      // the mdi prefix - it can't be found by the script if thats the case.

      $mdi-filename:         "${fileName}";
      $mdi-font-name:        "${fontName}";
      $mdi-font-family:      "${fontFamily}";
      $mdi-font-weight:      "${fontWeight}";
      $mdi-font-size-base:   24px !default;
      $mdi-css-prefix:       mdi !default;
      $mdi-version:          "${version.major}.${version.minor}.${version.patch}" !default;

      $mdi-icons: ();`;
                const dist = (0, path_1.resolve)(this.paths.dist.variables, `_variables.scss`);
                const icons = [];
                this.meta.forEach((icon) => icons.push(`  "${icon.name}": ${icon.codepoint}`));
                template = template.replace(/icons: \(\)/, `icons: (\n${icons.join(",\n")}\n)`);
                yield (0, promises_1.writeFile)(dist, template);
                console.log(`::: BUILD: generated _variables.scss`);
            }
            catch (err) {
                console.error(err);
                return err;
            }
        });
        console.log(`::: ---`);
        console.log(`::: Lab25 mdi iconfont generator with custom icon support`);
        this.paths.dist.font = (0, path_1.resolve)(cwd, config.paths.dist.font);
        this.paths.dist.variables = (0, path_1.resolve)(cwd, config.paths.dist.variables);
        this.paths.custom.svgs = (0, path_1.resolve)(cwd, config.paths.custom.svgs);
        this.paths.scanner = config.paths.scanner;
    }
    get version() {
        const { major, minor, patch } = this.fontbuild.version;
        return `${major}.${minor}.${patch}`;
    }
    get webfontConfig() {
        const { fontName } = this.fontbuild;
        const config = {
            files: this.meta.map((i) => `${this.paths.mdi.svgs}/u${i.codepoint}-${i.name}.svg`),
            fontName,
            formats: ["ttf", "eot", "woff", "woff2"],
            fontHeight: 512,
            descent: 64,
            normalize: true,
            centerHorizontally: true,
            version: this.version,
            svgicons2svgfont: {
                fontHeight: 512,
                descent: 64,
                normalize: true,
                centerHorizontally: true,
            },
        };
        return config;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`::: INIT: start`);
            this.fontbuild = yield Helper.readFileAndParse(this.paths.mdi.fontbuild);
            console.log(`::: CONFIG: Working with @mdi/svg: ${this.version}`);
            console.log(`::: CONFIG: dist folder for font: ${this.paths.dist.font}`);
            console.log(`::: CONFIG: dist folder for variables: ${this.paths.dist.variables}`);
            console.log(`::: CONFIG: folder of custom svgs: ${this.paths.custom.svgs}`);
            console.log(`::: CONFIG: scanning folder: ${this.paths.scanner.dir} with extensions: ${this.paths.scanner.extensions}`);
            console.log(`::: INIT: done`);
        });
    }
    scan() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`::: SCANNER: start`);
            let icons = [];
            // const stream = await fastglob.stream([`${this.paths.scanner.dir}/**/*.{${this.paths.scanner.extensions}}`], { dot: false });
            const files = yield (0, fast_glob_1.default)([`${this.paths.scanner.dir}/**/*.{${this.paths.scanner.extensions}}`], { dot: false });
            const expressions = {
                icon: (str) => str.match(/mdi-([\w-]+)/g),
                exclude: (str) => !!(str.match(/\d+px/) || str.match(/rotate-\d+/) || str.match(/spin/)),
            };
            yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
                var _a, e_1, _b, _c;
                const rl = (0, readline_1.createInterface)({
                    input: (0, fs_1.createReadStream)((0, path_1.join)(cwd, file)),
                    crlfDelay: Infinity,
                });
                try {
                    for (var _d = true, rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = yield rl_1.next(), _a = rl_1_1.done, !_a;) {
                        _c = rl_1_1.value;
                        _d = false;
                        try {
                            const line = _c;
                            const matches = expressions.icon(line);
                            if (matches)
                                matches.forEach((icon) => {
                                    return icons.push(icon.replace("mdi-", ""));
                                });
                        }
                        finally {
                            _d = true;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = rl_1.return)) yield _b.call(rl_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            })));
            this.icons = [...new Set(icons)].filter((icon) => !expressions.exclude(icon));
            console.log(`::: SCANNER: found occurances of ${icons.length} icons (${this.icons.length} unique icons)`);
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`::: BUILD: start`);
                yield this.initialize_build();
                yield this.compile();
                console.log(`::: BUILD: done`);
            }
            catch (err) {
                console.error(err);
                return err;
            }
        });
    }
    initialize_build() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mdi_meta = yield Helper.readFileAndParse(this.paths.mdi.meta);
                let available_codepoints = mdi_meta.filter((item) => !this.icons.includes(item.name)).map((item) => item.codepoint);
                const custom_icons_path_files = yield (0, promises_1.readdir)(this.paths.custom.svgs);
                const custom_icons = custom_icons_path_files
                    .filter((item) => (0, path_1.extname)(item) === ".svg")
                    .map((item, index) => {
                    const codepoint = available_codepoints[Math.floor(Math.random() * available_codepoints.length)];
                    available_codepoints = available_codepoints.filter((item) => item !== codepoint);
                    return {
                        name: (0, path_1.parse)(item).name,
                        id: `1k5-${index}`,
                        author: "Lab25",
                        codepoint: codepoint,
                        custom: true,
                        aliases: [],
                        tags: [],
                        version: "0.0.1",
                    };
                });
                this.meta = [...custom_icons, ...mdi_meta].filter((item) => {
                    return this.icons.includes(item.name) || mdi_meta.some((i) => i.aliases.includes(item.name) && this.icons.includes(i.name));
                });
                yield this.check_svg_naming();
            }
            catch (err) {
                console.error(err);
                return err;
            }
        });
    }
    check_svg_naming() {
        return new Promise((resolve) => {
            const errors = [];
            this.meta.forEach((icon) => {
                if (errors.length > 5)
                    return;
                if (icon.custom) {
                    const newFile = (0, path_1.join)(this.paths.mdi.svgs, `u${icon.codepoint}-${icon.name}.svg`);
                    const oldFile = (0, path_1.join)(this.paths.custom.svgs, `${icon.name}.svg`);
                    if ((0, fs_1.existsSync)(oldFile)) {
                        (0, fs_1.copyFile)(oldFile, newFile, (err) => {
                            if (err)
                                throw err;
                        });
                    }
                    else
                        errors.push(`Invalid icon at "${oldFile}"`);
                }
                else {
                    const newFile = (0, path_1.join)(this.paths.mdi.svgs, `u${icon.codepoint}-${icon.name}.svg`);
                    const oldFile = (0, path_1.join)(this.paths.mdi.svgs, `${icon.name}.svg`);
                    if ((0, fs_1.existsSync)(newFile))
                        return;
                    if ((0, fs_1.existsSync)(oldFile))
                        (0, fs_1.renameSync)(oldFile, newFile);
                    else
                        errors.push(`Invalid icon at "${oldFile}"`);
                }
            });
            if (errors.length) {
                errors.forEach((error) => console.error(error));
                console.error("...");
                process.exit(1);
            }
            resolve();
        });
    }
    compile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, webfont_1.default)(this.webfontConfig);
                const { fileName } = this.fontbuild;
                if (!(0, fs_1.existsSync)(this.paths.dist.variables))
                    yield (0, promises_1.mkdir)(this.paths.dist.variables, { recursive: true });
                if (!(0, fs_1.existsSync)(this.paths.dist.font))
                    yield (0, promises_1.mkdir)(this.paths.dist.font, { recursive: true });
                yield (0, promises_1.writeFile)((0, path_1.join)(this.paths.dist.font, `${fileName}-webfont.woff2`), result.woff2);
                yield (0, promises_1.writeFile)((0, path_1.join)(this.paths.dist.font, `${fileName}-webfont.eot`), result.eot);
                yield (0, promises_1.writeFile)((0, path_1.join)(this.paths.dist.font, `${fileName}-webfont.woff`), result.woff);
                yield (0, promises_1.writeFile)((0, path_1.join)(this.paths.dist.font, `${fileName}-webfont.ttf`), result.ttf);
                yield this.generateVariablesSCSS();
                console.log(`::: BUILD: generated webfont`);
            }
            catch (err) {
                console.error(err);
                return err;
            }
        });
    }
}
exports.default = default_1;
