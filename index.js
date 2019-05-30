const express = require("express");
const bodyParser = require("body-parser");
const mongo = require("mongodb").MongoClient;
const { mongodb, server } = require("./config.json");

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

  app.listen(server.port, () =>
    console.log(`Running server on: http://localhost:${server.port}`)
  );
};

mongo
  .connect(
    `mongodb://${
      mongodb.username && mongodb.password
        ? `${mongodb.username}:${mongodb.password}@`
        : ""
    }${mongodb.host}:${mongodb.port}`,
    { useNewUrlParser: true }
  )
  .then(db => db.db(mongodb.dbName))
  .then(startServer)
  .catch(console.error);
