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

const startServer = db => {
  const app = express();
  const {
    getArticle,
    getAllArticles,
    createArticle,
    deleteArticle,
    updateArticle,
    authenticate
  } = require("./controller").createController({
    db,
    bcrypt,
    fs,
    ObjectID,
    privateKeyPath: serverConfig.privateKeyPath
  });

  // TODO replace all the callback functions in this file with the ones from controller module
  app.use(bodyParser.json());
  app.use(cors());

  app.post("/auth", authenticate);
  app.get("/articles/:id", getArticle);
  app.get("/articles", getAllArticles);
  app.post("/articles", createArticle);
  app.delete("/articles/:id", deleteArticle);
  app.put("/articles/:id", updateArticle);

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
