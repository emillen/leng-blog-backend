const authenticate = ({ db, privateKey, bcrypt, sign }) => (
  { body: { username, password } },
  res
) =>
  db
    .collection("users")
    .findOne({ username })
    .then(user => (user ? bcrypt.compare(password, user.hash) : false))
    .then(userAuthenticated => {
      if (userAuthenticated)
        return sign({ username }, privateKey, {
          algorithm: "RS256"
        });
      else return null;
    })
    .then(token => {
      console.log(token);
      if (!token) res.status(403).send();
      else res.status(200).send({ token });
    })
    .catch(err => console.error(err) && res.status(500).send);

const authMiddleware = ({ publicKey, verify }) => (req, res, next) => {
  if (!req.header("Authorization")) return res.status(401).send();
  const token = req.header("Authorization").split(" ")[1];
  verify(token, publicKey, err => {
    if (err) return res.status(401).send();
    else return next();
  });
};

const createAuth = ({
  db,
  bcrypt,
  privateKey,
  publicKey,
  jwt: { sign, verify }
}) => ({
  authenticate: authenticate({ db, bcrypt, privateKey, sign }),
  authMiddleware: authMiddleware({ publicKey, verify })
});

module.exports = { createAuth };
