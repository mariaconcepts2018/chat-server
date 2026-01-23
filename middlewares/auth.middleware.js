import jwt from "jsonwebtoken";

// export const protect = (req, res, next) => {
//   const accessToken = req.cookies.accessToken;

//   if (!accessToken) {
//     return res.status(401).json({ error: "Unauthorized" });
//   }

//   try {
//     req.user = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
//     next();
//   } catch (err) {
//     console.log(err);
//     return res.status(401).json({ error: "Invalid token" });
//   }
// };

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
