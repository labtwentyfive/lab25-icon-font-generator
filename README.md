# Usage

## As node script

```
const Generator = require("lab25-icon-font-generator");

(async () => {
  try {
    const builder = new Generator.default({
      paths: {
        custom: { svgs: "path/to/custom/svgs" },
        dist: {
          font: "path/to/font/file/destination",
          variables: "path/to/variable/destination",
        },
        scanner: {
          dir: "(app|frontend)",
          extensions: "js,vue,slim,rb,ts,scss",
        },
      },
    });

    await builder.initialize();
    await builder.scan();
    await builder.build();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
```