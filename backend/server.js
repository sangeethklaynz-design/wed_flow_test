try {
  require("./dist/src/index");
} catch (error) {
  if (error?.code !== "MODULE_NOT_FOUND") {
    throw error;
  }

  require("./src/index");
}
