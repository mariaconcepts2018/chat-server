export default async function twilioWebhook(req, res) {
  const sessions = {};

  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  const from = req.body.From;
  const message = req.body.Body.trim();

  if (!sessions[from]) {
    sessions[from] = { step: 1, data: {} };
    twiml.message("Hi! Welcome.\nWhat is your name?");
    return res.type("text/xml").send(twiml.toString());
  }

  const session = sessions[from];

  if (session.step === 1) {
    session.data.name = message;
    session.step = 2;
    twiml.message("Great! Please enter your email address.");
  } else if (session.step === 2) {
    session.data.email = message;
    session.step = 3;
    twiml.message("Thanks! Now, tell me about your project.");
  } else if (session.step === 3) {
    session.data.project = message;

    session.step = 4;
    twiml.message("Now, tell me about your property type.");

    console.log(session.data);

    // Send collected data to your backend API
    // await axios.post(
    //   "https://your-backend.com/api/whatsapp-data",
    //   session.data
    // );

    twiml.message("Thank you! Your details have been submitted.");

    delete sessions[from]; // reset conversation
  }

  res.type("text/xml").send(twiml.toString());
}
