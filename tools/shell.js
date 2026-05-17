import { exec } from "child_process";

export default {
  run: async ({ command }) => {
    return new Promise((resolve) => {
      exec(command, (err, stdout, stderr) => {
        resolve({
          stdout,
          stderr,
          returncode: err ? err.code : 0
        });
      });
    });
  }
};
