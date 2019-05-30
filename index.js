const express = require("express");
const bodyParser = require("body-parser");
const mongo = require("mongodb").MongoClient;
const { mongodb: mongoConfig, server: serverConfig } = require("./config.json");

const startServer = db => {
  const app = express();
  app.use(bodyParser.json());

  app.get("/articles", (req, res) => {
    db.collection("articles")
      .find({})
      .toArray()
      .then(articles => {
        res.status(200).send(articles);
        return articles;
      })
      .then(console.log)
      .catch(_ => res.status(500).render());
  });

  app.post("/articles", ({ body }, res) => {
    if (!body.title || !body.markdown) return res.status(400).render();
    db.collection("articles")
      .insertOne({ markdown: body.markdown, title: body.title })
      .then(result => result.ops[0])
      .then(data => {
        res.status(201).send(data);
        return data;
      })
      .then(console.log)
      .catch(_ => res.status(500).render());
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
