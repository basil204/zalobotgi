// /index
const http = require("http");
const logger = require("./src/utils/logger.js");
const fs = require("fs"); // Import the 'fs' module for file system access

function aClient() {
  return {
    config: process.env,
    commands: new Map(),
    events: new Map(),
    getTime: function (ts) {
      return new Date(ts).toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZone: "Asia/Ho_Chi_ Minh",
      });
    },
    apis: {},
    mainPath: process.cwd(),
    messages: [], // thêm lưu trữ
  };
}

(async () => {
  (await import("dotenv")).config();

  const { Zalo } = await import("./ZCA/index.js");

  const zalo = new Zalo(
    {
      cookie: process.env.COOKIE,
      imei: process.env.IMEI,
      userAgent: process.env.USER_AGENT,
    },
    {
      selfListen: process.env.SELFLISTEN === "true",
      checkUpdate: process.env.CHECKUPDATE === "true",
    }
  );
  global.client = aClient();

  try {
    const api = await zalo.login();
    const { default: handleCommands } = await import(
      "./src/core/handleCommands.js"
    );
    const { default: handleEvent } = await import("./src/core/handleEvent.js");
    const { default: listen } = await import("./src/core/listen.js");

    handleCommands();
    handleEvent();

    const server = http.createServer((req, res) => {
      if (req.url === "/api/findmessage") {
        //  load file message_log
        try {
          const rawData = fs.readFileSync("message_log.json");
          client.messages = JSON.parse(rawData);
          logger.info("tải thành công từ message_log.json");
        } catch (error) {
          logger.error("lỗi cụ rồi:", error);
          // xử lý lỗi
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("lỗi rồi");
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(client.messages));
      } else if (req.url.startsWith("/api/findbyid")) {
        const urlParams = new URLSearchParams(req.url.split("?")[1]);
        const idToFind = urlParams.get("id");

        try {
          const rawData = fs.readFileSync("message_log.json");
          const messagesData = JSON.parse(rawData);

          if (messagesData[idToFind]) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(messagesData[idToFind]));
          } else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Không tìm thấy ID");
          }
        } catch (error) {
          logger.error("Lỗi cụ rồi:", error);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Lỗi rồi");
        }
      } else if (req.url.startsWith("/api/sendmessage")) {
        const urlParams = new URLSearchParams(req.url.split("?")[1]);
        const idToSend = urlParams.get("id");
        const messageToSend = urlParams.get("message");
        const messagePort = urlParams.get("port") || MessageType.PeerMessage; // Lấy port hoặc mặc định là PeerMessage

        try {
          api
            .sendMessage(messageToSend, idToSend, messagePort) // Sử dụng messagePort khi gửi
            .then(() => {
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("Tin nhắn đã được gửi thành công!");
            })
            .catch((error) => {
              logger.error("Lỗi khi gửi tin nhắn:", error);
              res.writeHead(500, { "Content-Type": "text/plain" });
              res.end("Lỗi khi gửi tin nhắn");
            });
        } catch (error) {
          logger.error("Lỗi chung:", error);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Lỗi rồi");
        }
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("làm gì có gì");
      }
    });

    server.listen(2410, () => {
      console.log("Server đang lắng nghe trên cổng 2410.");
      listen(api, zalo);
    });

    logger.info("Đã load thành công các mô-đun.");
  } catch (error) {
    console.error("Đã xảy ra lỗi:", error);
  }
})();
