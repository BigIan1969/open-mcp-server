import fetch from "node-fetch";

export default {
  get: async ({ url }) => {
    try {
      const res = await fetch(url);
      const body = await res.text();
      return {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body
      };
    } catch (e) {
      return { error: e.message };
    }
  }
};
