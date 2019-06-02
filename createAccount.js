const bcrypt = require("bcrypt");
const mongo = require("mongodb").MongoClient;
const mongoConfig = require("./config.json").mongodb;
const saltRounds = 10;
const username = process.argv[2];
const password = process.argv[3];

const createMongoUri = ({ username, password, host, port }) => {
  return `mongodb://${
    username && password ? `${username}:${password}@` : ""
  }${host}:${port}`;
};

if (username && password) {
  mongo
    .connect(createMongoUri(mongoConfig), { useNewUrlParser: true })
    .then(db => [db, db.db(mongoConfig.dbName)])
    .then(([db, dbo]) => {
      return bcrypt.hash(password, saltRounds).then(hash => {
        return dbo
          .collection("users")
          .insertOne({ username, hash })
          .then(_ => db.close());
      });
    })

    .then(_ => console.log("Account created"))
    .catch(console.error);
}
