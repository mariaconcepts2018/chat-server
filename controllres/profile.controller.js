export const getProfile = async (req, res) => {
  const { name, email } = req.user;
  res.json({
    success: true,
    admin: { name, email },
  });
};
