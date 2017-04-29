const mongoose = require('mongoose')

const blogSchema = mongoose.Schema({
  title: {type: String, required: true},
  author: {
    firstName: {type: String, required: true},
    lastName: {type: String, required: true}
  },
  content: {type: String, required: true}
})

blogSchema.virtual('authorString').get(function(){
  return `${this.author.firstName} ${this.author.lastName}`.trim()
})

blogSchema.methods.apiRepr = function(){
  return {
    id: this._id,
    title: this.title,
    author: this.authorString,
    content: this.content
  }
}

const Blog = mongoose.model('Blog', blogSchema)

module.exports = {Blog}
