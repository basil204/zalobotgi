module.exports = {
  config: {
    name: "test", // Command name
    version: "1.0.0",
    hasPermssion: 0, // Permission level (0 for everyone)
    credits: "Your Name", // Your credit
    description: "A simple test command", // Command description
    commandCategory: "general", // Command category
    usages: "", // How to use the command
    cooldowns: 5, // Cooldown in seconds
  },

  run: function (api, event, args) {},
};
