module.exports = {
    apps: [
      {
        name: "WS-Server",
        script: "src/socket/server.ts",
        interpreter: "node",
        interpreterArgs: "--import tsx",
      },
    ],
};