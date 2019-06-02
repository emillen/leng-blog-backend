const express = require("express");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");
const mongo = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const { mongodb: mongoConfig, server: serverConfig } = require("./config.json");

const handleErrors = ({ res, err }) => {
  console.error(err);
  res.status(500).send();
};

const has24Chars = s => s && s.length === 24;

const startServer = db => {
  const app = express();
  app.use(bodyParser.json());
  app.use(cors());

  app.get("/articles/:id", ({ params: { id } }, res) => {
    if (!has24Chars(id)) return res.status(404).send();
    db.collection("articles")
      .findOne({ _id: new ObjectID(id) })
      .then(article => {
        if (!article) res.status(404).send();
        else res.status(200).send(article);
        return article;
      })
      .then(console.log)
      .catch(err => handleErrors({ res, err }));
  });

  app.get("/articles", (_, res) => {
    db.collection("articles")
      .find({})
      .toArray()
      .then(articles => {
        res.status(200).send(articles);
        return articles;
      })
      .then(console.log)
      .catch(err => handleErrors({ res, err }));
  });

  app.post("/articles", ({ body: { title, markdown } }, res) => {
    if (!title || !markdown) return res.status(400).send();
    db.collection("articles")
      .insertOne({ markdown, title })
      .then(result => result.ops[0])
      .then(data => {
        res.status(201).send(data);
        return data;
      })
      .then(console.log)
      .catch(err => handleErrors({ res, err }));
  });

  app.delete("/articles/:id", (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(404).send();
    db.collection("articles")
      .deleteOne({ _id: new ObjectID(id) })
      .then(obj => {
        res.status(200).send(obj.result);
        return obj.result;
      })
      .then(console.log)
      .catch(err => handleErrors({ err, res }));
  });

  app.put("/articles/:id", (req, res) => {
    const id = req.params.id;
    const { title, markdown } = req.body;

    if (!id) return res.status(404).send();
    if (!title || !markdown) return res.status(400).send();

    db.collection("articles")
      .updateOne({ _id: new ObjectID(id) }, { $set: { title, markdown } }, {})
      .then(doc => doc.result)
      .then(result => {
        res.status(200).send(result);
        return result;
      })
      .then(console.log)
      .catch(err => handleErrors({ err, res }));
  });

  app.post("/auth", ({ body: { username, password } }, res) => {
    db.collection("users")
      .findOne({ username })
      .then(user => (user ? bcrypt.compare(password, user.hash) : false))
      .then(userAuthenticated => {
        if (userAuthenticated) {
          return fs.open(serverConfig.privateKeyPath, "r").then(filehandle =>
            Promise.all([filehandle, filehandle.readFile()]).then(
              ([filehandle, privateKey]) => {
                return filehandle.close().then(_ =>
                  jwt.sign({ username }, privateKey, {
                    algorithm: "RS256"
                  })
                );
              }
            )
          );
        }
        return null; // TODO create token and send to client
      })
      .then(token => {
        if (!token) res.status(403).send();
        else res.status(200).send({ token });
      })
      .then(() => res.status(200).send())
      .catch(err => console.error(err) && res.status(500).send);
  });

  app.listen(serverConfig.port, () =>
    console.log(`Running server on: http://localhost:${serverConfig.port}`)
  );
};

const createMongoUri = ({ username, password, host, port }) => {
  return `mongodb://${
    username && password ? `${username}:${password}@` : ""
  }${host}:${port}`;
};

mongo
  .connect(createMongoUri(mongoConfig), { useNewUrlParser: true })
  .then(db => db.db(mongoConfig.dbName))
  .then(startServer)
  .catch(console.error);
