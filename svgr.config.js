/** @type {import('@svgr/core').Config} */
module.exports = {
  typescript: true,
  jsxRuntime: "automatic",
  icon: true, // width/height = 1em → size with className
  expandProps: "end", // {...props} last so strokeWidth/className override file attrs
  svgProps: { "aria-hidden": "true", focusable: "false" },
  replaceAttrValues: {
    "#0B1B3F": "currentColor",
    "#000": "currentColor",
    "#000000": "currentColor",
    "#4A5878": "currentColor",
    "#A5ACB8": "currentColor",
    "#FFFFFF": "currentColor",
    "#fff": "currentColor",
  },
  svgoConfig: {
    plugins: [
      { name: "preset-default", params: { overrides: { removeViewBox: false } } },
      "removeDimensions",
    ],
  },
  prettier: true,
  filenameCase: "pascal",
  indexTemplate: (paths) =>
    paths
      .map((p) => {
        const n = p.path.split("/").pop().replace(/\.tsx$/, "");
        return `export { default as ${n} } from "./${n}";`;
      })
      .join("\n") + "\n",
};
