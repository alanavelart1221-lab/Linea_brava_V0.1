module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Hermes (Expo Go) no parsea campos/métodos privados de clase (#x); los
    // transpilamos para evitar "private properties are not supported".
    plugins: [
      ["@babel/plugin-transform-class-properties", { loose: true }],
      ["@babel/plugin-transform-private-methods", { loose: true }],
      ["@babel/plugin-transform-private-property-in-object", { loose: true }],
    ],
  };
};
