const express = require("express");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");
const mongo = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const { mongodb: mongoConfig, server: serverConfig } = require("./config.json");

const startServer = ([privateKey, publicKey, db]) => {
  const app = express();
  const {
    getArticle,
    getAllArticles,
    createArticle,
    deleteArticle,
    updateArticle
  } = require("./controller").createController({
    db,
    ObjectID
  });
  const { authenticate, authMiddleware } = require("./auth").createAuth({
    bcrypt,
    db,
    publicKey,
    privateKey,
    jwt
  });

  app.use(bodyParser.json());
  app.use(cors());

  // public paths
  app.post("/auth", authenticate);
  app.get("/articles/:id", getArticle);
  app.get("/articles", getAllArticles);

  app.use(authMiddleware);

  // Protected paths
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

const readFile = filePath =>
  fs
    .open(filePath, "r")
    .then(filehandle =>
      Promise.all([filehandle, filehandle.readFile()]).then(
        ([filehandle, contents]) => filehandle.close().then(_ => contents)
      )
    );

// Keeping keys in memory from now on
const getPrivateKey = readFile(serverConfig.privateKeyPath);
const gePublicKey = readFile(serverConfig.publicKeyPath);
const getDb = mongo
  .connect(createMongoUri(mongoConfig), { useNewUrlParser: true })
  .then(connection => connection.db(mongoConfig.dbName));

Promise.all([getPrivateKey, gePublicKey, getDb])
  .then(startServer)
  .catch(console.error);
