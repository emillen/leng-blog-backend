const handleErrors = ({ res, err }) => {
  console.error(err);
  res.status(500).send();
};
const has24Chars = s => s && s.length === 24;

const getArticle = ({ db, ObjectID }) => ({ params: { id } }, res) => {
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
};

const getAllArticles = ({ db }) => (_, res) => {
  db.collection("articles")
    .find({})
    .toArray()
    .then(articles => {
      res.status(200).send(articles);
      return articles;
    })
    .then(console.log)
    .catch(err => handleErrors({ res, err }));
};

const createArticle = ({ db }) => ({ body: { title, markdown } }, res) => {
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
};

const deleteArticle = ({ db, ObjectID }) => (req, res) => {
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
};

const updateArticle = ({ db, ObjectID }) => (req, res) => {
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
};

const createController = ({ db, ObjectID, jwt }) => ({
  getArticle: getArticle({ db, ObjectID }),
  getAllArticles: getAllArticles({ db }),
  createArticle: createArticle({ db }),
  deleteArticle: deleteArticle({ db, ObjectID }),
  updateArticle: updateArticle({ db, ObjectID })
});

module.exports = { createController };
