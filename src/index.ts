import { resolve, join, extname, parse } from "path";
import { readFile, mkdir, writeFile, readdir } from "fs/promises";
import { createReadStream, readdirSync, existsSync, copyFile, renameSync } from "fs";
import fastglob from "fast-glob";
import { createInterface } from "readline";
import webfont from "webfont";

const cwd = process.cwd();

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
  version: { major: string; minor: string; patch: string };
};

type BuilderConfig = {
  paths: {
    custom: { svgs: string };
    dist: { font: string; variables: string };
    scanner: { dir: string; extensions: string };
  };
};

const Helper = {
  readFileAndParse: async (path: string) => {
    const str = await readFile(path, { encoding: "utf-8" });

    return JSON.parse(str);
  },
};

export default class {
  public paths = {
    dist: {
      font: "",
      variables: "",
    },
    mdi: {
      meta: resolve(cwd, "node_modules/@mdi/svg/meta.json"),
      fontbuild: resolve(cwd, "node_modules/@mdi/svg/font-build.json"),
      svgs: resolve(cwd, "node_modules/@mdi/svg/svg"),
    },
    custom: {
      svgs: "",
    },
    scanner: {
      dir: "",
      extensions: "",
    },
  };

  public fontbuild: FontBuild = {
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

  public meta: Meta[] = [];

  public icons: string[] = [];

  constructor(config: BuilderConfig) {
    console.log(`::: ---`);
    console.log(`::: Lab25 mdi iconfont generator with custom icon support`);
    this.paths.dist.font = resolve(cwd, config.paths.dist.font);
    this.paths.dist.variables = resolve(cwd, config.paths.dist.variables);
    this.paths.custom.svgs = resolve(cwd, config.paths.custom.svgs);
    this.paths.scanner = config.paths.scanner;
  }

  public get version(): string {
    const { major, minor, patch } = this.fontbuild.version;
    return `${major}.${minor}.${patch}`;
  }

  public get webfontConfig() {
    const { fontName } = this.fontbuild;
    const config = {
      files: this.meta.map((i) => `${this.paths.mdi.svgs}/u${i.codepoint}-${i.name}.svg`),
      fontName,
      formats: ["ttf", "eot", "woff", "woff2"],
      fontHeight: 512,
      descent: 64,
      normalize: true,
      version: this.version,
      svgicons2svgfont: {
        fontHeight: 512,
        descent: 64,
        normalize: true,
      },
    };

    return config;
  }

  public async initialize() {
    console.log(`::: INIT: start`);

    this.fontbuild = await Helper.readFileAndParse(this.paths.mdi.fontbuild);

    console.log(`::: CONFIG: Working with @mdi/svg: ${this.version}`);
    console.log(`::: CONFIG: dist folder for font: ${this.paths.dist.font}`);
    console.log(`::: CONFIG: dist folder for variables: ${this.paths.dist.variables}`);
    console.log(`::: CONFIG: folder of custom svgs: ${this.paths.custom.svgs}`);
    console.log(`::: CONFIG: scanning folder: ${this.paths.scanner.dir} with extensions: ${this.paths.scanner.extensions}`);
    console.log(`::: INIT: done`);
  }

  public async scan() {
    console.log(`::: SCANNER: start`);
    let icons: string[] = [];
    // const stream = await fastglob.stream([`${this.paths.scanner.dir}/**/*.{${this.paths.scanner.extensions}}`], { dot: false });
    const files = await fastglob([`${this.paths.scanner.dir}/**/*.{${this.paths.scanner.extensions}}`], { dot: false });

    const expressions = {
      icon: (str: string) => str.match(/mdi-([\w-]+)/g),
      exclude: (str: string) => !!(str.match(/\d+px/) || str.match(/rotate-\d+/) || str.match(/spin/)),
    };

    try {
      await Promise.all(
        files.map(async (file) => {
          const rl = createInterface({
            input: createReadStream(join(cwd, file)),
            crlfDelay: Infinity,
          });

          for await (const line of rl) {
            const matches = expressions.icon(line);
            if (matches)
              matches.forEach((icon) => {
                return icons.push(icon.replace("mdi-", ""));
              });
          }
        })
      );

      this.icons = [...new Set(icons)].filter((icon) => !expressions.exclude(icon));

      console.log(`::: SCANNER: found occurances of ${icons.length} icons (${this.icons.length} unique icons)`);
    } catch (err) {
      throw err;
    }
  }

  public async build() {
    try {
      console.log(`::: BUILD: start`);
      await this.initialize_build();
      await this.compile();
      console.log(`::: BUILD: done`);
    } catch (err) {
      throw err;
    }
  }

  private async initialize_build() {
    try {
      const mdi_meta: Meta[] = await Helper.readFileAndParse(this.paths.mdi.meta);

      const custom_icons_path_files = await readdir(this.paths.custom.svgs);
      const custom_icons: Meta[] = custom_icons_path_files
        .filter((item) => extname(item) === ".svg")
        .map((item, index) => {
          const codepoint = `FF${index < 256 ? "0" : ""}${index < 16 ? "0" : ""}${index.toString(16).toUpperCase()}`;
          return {
            name: parse(item).name,
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

      await this.check_svg_naming();
    } catch (err) {
      throw err;
    }
  }

  private async check_svg_naming() {
    try {
      const errors: string[] = [];

      this.meta.forEach((icon) => {
        if (errors.length > 5) return;

        if (icon.custom) {
          const newFile = join(this.paths.mdi.svgs, `u${icon.codepoint}-${icon.name}.svg`);
          const oldFile = join(this.paths.custom.svgs, `${icon.name}.svg`);

          if (existsSync(oldFile)) {
            copyFile(oldFile, newFile, (err) => {
              if (err) throw err;
            });
          } else errors.push(`Invalid icon at "${oldFile}"`);
        } else {
          const newFile = join(this.paths.mdi.svgs, `u${icon.codepoint}-${icon.name}.svg`);
          const oldFile = join(this.paths.mdi.svgs, `${icon.name}.svg`);

          if (existsSync(newFile)) return;
          if (existsSync(oldFile)) renameSync(oldFile, newFile);
          else errors.push(`Invalid icon at "${oldFile}"`);
        }
      });

      if (errors.length) {
        throw errors;
      }
      return;
    } catch (err) {
      throw err;
    }
  }

  private async compile() {
    try {
      const result = await webfont(this.webfontConfig);
      const { fileName } = this.fontbuild;

      if (!existsSync(this.paths.dist.variables)) await mkdir(this.paths.dist.variables, { recursive: true });
      if (!existsSync(this.paths.dist.font)) await mkdir(this.paths.dist.font, { recursive: true });

      await this.writeFile(join(this.paths.dist.font, `${fileName}-webfont.woff2`), result.woff2);
      await this.writeFile(join(this.paths.dist.font, `${fileName}-webfont.eot`), result.eot);
      await this.writeFile(join(this.paths.dist.font, `${fileName}-webfont.woff`), result.woff);
      await this.writeFile(join(this.paths.dist.font, `${fileName}-webfont.ttf`), result.ttf);

      await this.generateVariablesSCSS();
      console.log(`::: BUILD: generated webfont`);
    } catch (err) {
      throw err;
    }
  }

  private generateVariablesSCSS = async () => {
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

      const dist = resolve(this.paths.dist.variables, `_variables.scss`);

      const icons: string[] = [];

      this.meta.forEach((icon) => icons.push(`  "${icon.name}": ${icon.codepoint}`));
      template = template.replace(/icons: \(\)/, `icons: (\n${icons.join(",\n")}\n)`);

      await this.writeFile(dist, template);
      console.log(`::: BUILD: generated _variables.scss, path: ${dist}`);
    } catch (err) {
      throw err;
    }
  };

  private writeFile(path: string, contents: any) {
    try {
      console.log(`::: WRITING FILE: ${path}`);
      writeFile(path, contents);
    } catch (err) {
      throw err;
    }
  }
}
