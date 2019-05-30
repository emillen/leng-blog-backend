const express = require("express");
const mongo = require("mongodb").MongoClient;
const { mongodb, server } = require("./config.json");

const startServer = db => {
  const app = express();

  app.get("/", (req, res) => res.send("Hello world"));
  app.listen(server.port, () =>
    console.log(`Running server on: http://localhost:${server.port}`)
  );
};

mongo
  .connect(mongodb.url, { useNewUrlParser: true })
  .then(startServer)
  .catch(console.error);
