// src/core/handleEvent.js
const { readdirSync } = require("fs");
const path = require("path");
const logger = require("../utils/logger");

module.exports = () => {
  const client = global.client;
  const commandPath = path.join(__dirname, "..", "modules", "commands");
  const commandFile = readdirSync(commandPath).filter((File) =>
    File.endsWith(".js")
  );

  let commandCount = 0,
    replyCount = 0,
    noprefixCount = 0,
    onloadCount = 0,
    anyEventCount = 0;

  const commandNames = [];

  for (const File of commandFile) {
    try {
      delete require.cache[require.resolve(path.join(commandPath, File))];
      const command = require(path.join(commandPath, File));
      if (!command.config.name) continue;

      if (command.run) {
        client.commands.set(command.config.name, command);
        commandCount++;
        commandNames.push(command.config.name);
      }

      if (command.noprefix) {
        noprefixCount++;
      }

      if (command.onload) {
        onloadCount++;
      }

      if (command.handleReply) {
        replyCount++;
      }

      if (command.anyEvent) {
        anyEventCount++;
      }
    } catch (error) {
      logger.error(`Lỗi khi tải lệnh ${File}:`, error); // Ghi log lỗi cụ thể
    }
  }

  const commandNamesString =
    commandNames.length > 0 ? commandNames.join("\n") : "Không có lệnh";

  logger.info(
    "Đã load thành công",
    commandCount,
    "lệnh:\n",
    commandNamesString
  );
};
