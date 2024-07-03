const { MessageMedia, LocalAuth, Client } = require("whatsapp-web.js");
// const { WhatsAppWebClient } = require("./classes")
const express = require("express");
const socketIO = require("socket.io");
const qrcode = require("qrcode");
const http = require("http");
const fs = require("fs");
const { phoneNumberFormatter, convertToLocalTime } = require("./helpers/formatter");
const fileUpload = require("express-fileupload");
const axios = require("axios");
const auth = require('basic-auth')
const port = process.env.PORT || 8000;
const cors = require('cors');
const { body, validationResult } = require("express-validator");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors())
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
/**
 * BASED ON MANY QUESTIONS
 * Actually ready mentioned on the tutorials
 * 
 * Many people confused about the warning for file-upload
 * So, we just disabling the debug for simplicity.
 */
app.use(fileUpload({
  debug: false
}));

app.get("/", (req, res) => {
  let user = auth(req)
  if (user === undefined || user['name'] !== 'admin' || user['pass'] !== 'napps.in') {
    res.statusCode = 401
    res.setHeader('WWW-Authenticate', 'Basic realm="Node"')
    res.end('Unauthorized')
  } else {
    res.sendFile("index-multiple-accounts.html", {
      root: __dirname,
    })
  }
});

const sessions = [];
const SESSIONS_FILE = "./whatsapp-sessions.json";

const createSessionsFileIfNotExists = function () {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      console.log("Sessions file created successfully.");
    } catch (err) {
      console.log("Failed to create sessions file: ", err);
    }
  }
};

createSessionsFileIfNotExists();

const setSessionsFile = function (sessions) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function (err) {
    if (err) {
      console.log(err);
    }
  });
};

const getSessionsFile = function () {
  return JSON.parse(fs.readFileSync(SESSIONS_FILE));
};

const createSession = function (id, description) {
  console.log("Creating session: " + id);
  const client = new Client({
    // restartOnAuthFail: true,
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-gpu",
        "--hide-scrollbars",
        "--disable-cache",
        "--disable-application-cache",
        "--disable-gpu-driver-bug-workarounds",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // <- this one doesn't works in Windows
      ],
    },
    authStrategy: new LocalAuth({
      clientId: id,
      dataPath: './wweb_auth'
    }),
  });

  client.initialize();

  client.on("message", async (msg) => {
    const userMessage = msg.body
    if (userMessage.length > 0 &&
      msg?.from.includes('@c') &&
      msg?._data?.isNewMsg &&
      !msg?.to.split('@')[0].includes('9520851967')) {
      const userMessage = msg.body
      const findGroupByName = async function (name) {
        const group = await client.getChats().then(chats => {
          return chats.find(chat =>
            chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
          );
        });
        return group;
      }
      const group = await findGroupByName('Sales Napps');
      if (!group) {
        console.log('No group found with name: ' + group)
      } else {
        chatId = group.id._serialized;
        client.sendMessage(chatId, `
*${msg?._data?.notifyName || 'Someone'}* replied back on bot ${id}(${msg?.to.split('@')[0]})
  
Potential customer details :
  
WA Mobile : ${msg?.from.split('@')[0]}
Name : ${msg?._data?.notifyName}
Message : *${userMessage}*
  
Sent Date & Time : ${convertToLocalTime(msg?._data?.t)}
  
Abhi inse chat ya call kare, Jo bhi inse baat kar raha, group mein bata dey!

Focus karne wale messages, jese "Hi,Hey,Hello" ya aese messages jisme lage human ne reply diya hein.

Note : Pehle whatsapp par baat kare, agar na ho to call kare! Aur Deal hone par 10% of Software MRP aapka,
Jo ki Registration fees par lagta, Minium cost 5000 se start hoti 10000, 15000 tak jaati.
`)
      }

    }
  });

  client.on("qr", (qr) => {
    console.log("QR RECEIVED", qr);
    qrcode.toDataURL(qr, (err, url) => {
      io.emit("qr", { id: id, src: url });
      io.emit("message", { id: id, text: "QR Code received, scan please!" });
    });
  });

  client.on("ready", () => {
    io.emit("ready", { id: id });
    io.emit("message", { id: id, text: "Whatsapp is ready!" });

    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
    savedSessions[sessionIndex].ready = true;
    setSessionsFile(savedSessions);
  });

  client.on("authenticated", () => {
    io.emit("authenticated", { id: id });
    io.emit("message", { id: id, text: "Whatsapp is authenticated!" });
  });

  client.on("auth_failure", function () {
    io.emit("message", { id: id, text: "Auth failure, restarting..." });
  });

  client.on("disconnected", (reason) => {
    io.emit("message", { id: id, text: "Whatsapp is disconnected!" });
    client.destroy();
    client.initialize();

    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
    savedSessions.splice(sessionIndex, 1);
    setSessionsFile(savedSessions);

    io.emit("remove-session", id);
  });

  sessions.push({
    id: id,
    description: description,
    client: client,
  });

  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);

  if (sessionIndex == -1) {
    savedSessions.push({
      id: id,
      description: description,
      ready: false,
    });
    setSessionsFile(savedSessions);
  }
};

const init = function (socket) {
  const savedSessions = getSessionsFile();

  if (savedSessions.length > 0) {
    if (socket) {
      savedSessions.forEach((e, i, arr) => {
        arr[i].ready = false;
      });

      socket.emit("init", savedSessions);
    } else {
      savedSessions.forEach((sess) => {
        createSession(sess.id, sess.description);
      });
    }
  }
};

init();

// Socket IO
io.on("connection", function (socket) {
  init(socket);

  socket.on("create-session", function (data) {
    console.log("Create session: " + data.id);
    createSession(data.id, data.description);
  });
});

// Send message
app.post("/send-message", [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  if (req.body.number.length < 9) {
    return res.status(422).json({
      status: false,
      message: "The number is not appropiate!",
    });
  }

  const sender = req.body.sender;
  const number = phoneNumberFormatter(req.body.number);
  const message = req.body.message;

  const client = sessions.find((sess) => sess.id == sender)?.client;

  if (!client) {
    return res.status(422).json({
      status: false,
      message: `The sender: ${sender} is not found!`,
    });
  }

  const isRegisteredNumber = await client.isRegisteredUser(number);

  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: "The number is not registered",
    });
  }

  client
    .sendMessage(number, message)
    .then((response) => {
      res.status(200).json({
        status: true,
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    });
});

// Send media
app.post("/send-media", async (req, res) => {

  const sender = req.body.sender;
  const number = phoneNumberFormatter(req.body.number);
  const caption = req.body.caption;
  const imagesFromPayload = req.body?.images;
  const client = sessions.find((sess) => sess.id == sender)?.client;

  if (!client) {
    return res.status(422).json({
      status: false,
      message: `The sender: ${sender} is not found!`,
    });
  }

  const isRegisteredNumber = await client.isRegisteredUser(number);

  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: "The number is not registered",
    });
  }

  let sendCount = 0
  if (imagesFromPayload) {
    imagesFromPayload.map(async (imageUrl, i) => {
      const media = await MessageMedia.fromUrl(imageUrl);
      let _caption = ''
      if (i === 0) {
        _caption = caption
      }
      sendCount = sendCount + 1
      console.log("inside sent")
      client.sendMessage(number, media, {
        caption: _caption
      }).catch(err => {
        console.log(err)
        res.status(500).json({
          status: false,
          response: err
        });
      });
    })
  }
  console.log(sendCount,'sendCount')
  if (imagesFromPayload.length > 0) {
    console.log('inside sent count!')
    res.status(202).json({
      status: true,
    });
  }
  // ATTACHMENT CODE TO TRY
  //************************************ */
  // let mimetype;
  // const attachment = await axios
  //   .get(fileUrl, { responseType: "arraybuffer" })
  //   .then((response) => {
  //     mimetype = response.headers["content-type"];
  //     return response.data.toString("base64");
  //   });

  // const media = new MessageMedia(mimetype, attachment, "Lampiran Berkas");

  // client
  //   .sendMessage(number, media, { caption: caption })
  //   .then((response) => {
  //     res.status(200).json({
  //       status: true,
  //       response: response,
  //     });
  //   })
  //   .catch((err) => {
  //     res.status(500).json({
  //       status: false,
  //       response: err,
  //     });
  //   });
});


// Send message to group
// You can use chatID or group name, yea!
app.post('/send-group-message', [
  body('id').custom((value, { req }) => {
    if (!value && !req.body.name) {
      throw new Error('Invalid value, you can use `id` or `name`');
    }
    return true;
  }),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  let chatId = req.body.id;
  const groupName = req.body.name;
  const message = req.body.message;

  // Find the group by name
  if (!chatId) {
    const group = await findGroupByName(groupName);
    if (!group) {
      return res.status(422).json({
        status: false,
        message: 'No group found with name: ' + groupName
      });
    }
    chatId = group.id._serialized;
  }

  client.sendMessage(chatId, message).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});


server.listen(port, function () {
  console.log("App running on *: " + port);
});
