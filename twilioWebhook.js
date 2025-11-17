import User from "./models/User.js";

const sessions = {}; // in-memory store

export default async function twilioWebhook(req, res) {
  const from = req.body.From;
  const phoneNumber = from.replace("whatsapp:", "");
  const incomingMsg = req.body.Body?.trim();

  // Initialize session for new users
  if (!sessions[from]) {
    sessions[from] = { step: "start" };
  }

  const user = sessions[from];

  // Conversation logic
  switch (user.step) {
    case "start":
      user.step = "name";
      return reply(
        res,
        "👋 Hi! Let's get your details.\n\nWhat is your *Name*?"
      );

    case "name":
      user.name = incomingMsg;
      user.step = "email";
      return reply(
        res,
        `Nice to meet you *${user.name}*! 😊\nPlease enter your *Email*:`
      );

    case "email":
      user.email = incomingMsg;
      user.step = "location";
      return reply(res, "Great! Now please type your *Location*:");

    case "location":
      user.location = incomingMsg;
      user.step = "done";

      console.log("\n📥 New Form Submission:");
      const data = { ...user, phone: phoneNumber, leadSource: "whatsapp" };

      try {
        const newUser = new User(data);
        await newUser.save();
        return reply(
          res,
          `🎉 *Thank You!*\n\nHere are your details:\n` +
            `• *Name:* ${user.name}\n` +
            `• *Email:* ${user.email}\n` +
            `• *Location:* ${user.location}\n\n` +
            `We will contact you shortly!`
        );
      } catch (error) {
        console.log("server Error");
        return reply(res, "Your details have already been recorded. ✔️");
      }

    default:
      return reply(res, "Your details have already been recorded. ✔️");
  }
}

function reply(res, text) {
  res.set("Content-Type", "text/xml");
  return res.send(`
    <Response>
      <Message>${text}</Message>
    </Response>
  `);
}
