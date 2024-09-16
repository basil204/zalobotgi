// src/core/handleCommand.js
module.exports = (api, zca) => {
  const {
    anyEvent,
    onLoad,
    handleReaction,
    handleReply,
    handleEvent,
    handleCommand,
  } = require("./action")(api, zca);
  // Echo bot
  const fs = require("fs");
  let messageData = {};
  try {
    messageData = JSON.parse(fs.readFileSync("message_log.json"));
  } catch (err) {}

  onLoad();
  api.listener.on("message", (message) => {
    const currentTime = new Date().toLocaleString();
    console.log(
      "id:" +
        message.data.uidFrom +
        " | Tên: " +
        message.data.dName +
        " | Tin Nhắn: " +
        message.data.content +
        " | Thời Gian: " +
        currentTime
    );
    anyEvent(message);
    handleCommand(message);
    if (message.quote) {
      handleReply(message);
    }

    const userId = message.data.uidFrom;

    if (!messageData[userId]) {
      messageData[userId] = {
        id: userId,
        nameuser: message.data.dName,
        message: [{ content: message.data.content, timestamp: currentTime }],
      };
    } else {
      messageData[userId]["message"].push({
        content: message.data.content,
        timestamp: currentTime,
      });
    }

    fs.writeFileSync("message_log.json", JSON.stringify(messageData));
  });

  api.listener.on("group_event", (data) => {
    console.log(data, "2");
    anyEvent(data);
    handleEvent(data);
  });

  api.listener.on("reaction", (reaction) => {
    console.log(reaction);
    anyEvent(reaction);
    handleReaction(reaction);
  });

  api.listener.on("undo", (undo) => {
    console.log(undo);
    anyEvent(undo);
    handleEvent(undo);
  });

  api.listener.start();
};
