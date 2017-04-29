const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

mongoose.Promise = global.Promise

const {DATABASE_URL, PORT} = require('./config')
const {Blog} = require('./models')

const app = express()
app.use(bodyParser.json())

app.get('/blogs', (req, res) => {
  Blog
    .find()
    .exec()
    .then(blogs => {
      res.json({
        blogs: blogs.map(blog => blog.apiRepr())
      })
    })
    .catch(
      err => {
        console.log(err)
        res.status(500).json({message: 'Internal server error'})
      }
    )
})

app.get('/blogs/:id', (req, res) => {
  Blog
    .findById(req.params.id)
    .exec()
    .then(blog => res.json(blog.apiRepr()))
    .catch(err => {
      console.log(err)
      res.status(500).json({message: 'Internal server error'})
    })
})

app.post('/blogs', (req, res) => {
  const requiredFields = ['title', 'author', 'content']
  for(let i=0; i<requiredFields.length; i++){
    const field = requiredFields[i]
    if(!(field in req.body)){
      const message = `Missing ${field} in request body`
      console.log(message)
      return res.status(400).send(message)
    }
  }

  Blog
    .create({
      title: req.body.title,
      author: req.body.author,
      content: req.body.content
    })
    .then(blog => res.status(201).json(blog.apiRepr()))
    .catch(err => {
      console.log(err)
      res.status(500).json({message: 'Internal server error'})
    })
})

app.put('/blogs/:id', (req, res) => {
  if(!(req.body.id && req.params.id && req.params.id === req.body.id)){
    const message = `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`
    console.log(message)
    res.status(400).json({message: message})
  }
  const toUpdate = {}
  const updatableFields = ['title', 'author', 'content']

  updatableFields.forEach(field => {
    if(field in req.body){
      toUpdate[field] = req.body[field]
    }
  })

  Blog
    .findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .exec()
    .then(() => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}))
})

app.delete('/blog/:id', (req, res) => {
  Blog
    findByIdAndRemove(req.params.id)
    .exec()
    .then(() => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}))
})

app.use('*', (req, res) => {
  res.status(404).json({message: 'Not Found'})
})

let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer}
