import fs from "fs/promises";

export default {
  read: async ({ path }) => {
    try {
      const content = await fs.readFile(path, "utf8");
      return { content };
    } catch (e) {
      return { error: e.message };
    }
  },

  write: async ({ path, content }) => {
    try {
      await fs.writeFile(path, content, "utf8");
      return { status: "ok" };
    } catch (e) {
      return { error: e.message };
    }
  }
};
