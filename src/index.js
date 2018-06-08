'use strict'

const http = require('http')
const listenOnFreePort = require('listen-on-free-port')
const stoppable = require('stoppable')
const express = require('express')
const cloneDeep = require('clone-deep')
const bodyParser = require('body-parser')

const { Just, Nothing } = require('crocks/maybe')

const {
  addPost,
  deletePost,
  getPost,
  getPosts,
  updatePost
} = require('./posts')

const {
  addComment,
  deleteComment,
  getComment,
  getCommentsForPost,
  updateComment
} = require('./comments')

const {
  addAuthor,
  deleteAuthor,
  getAuthor,
  getAuthors,
  getCommentsForAuthor,
  getPostsForAuthor,
  updateAuthor
} = require('./authors')

const withErrorLogging = fn => (...args) => {
  try {
    return fn(...args)
  } catch (e) {
    console.log(e) // eslint-disable-line no-console
    throw e
  }
}

let server = Nothing()
module.exports = {
  start: data =>
    listenOnFreePort(3000, ['localhost'], () => {
      const app = express()

      const siteData = { data: cloneDeep(data) }

      const jsonParser = bodyParser.json()
      app.use((req, res, next) => {
        req.siteData = siteData
        next()
      })

      app
        .route('/posts')
        .get(withErrorLogging(getPosts))
        .post(jsonParser, withErrorLogging(addPost))
      app
        .route('/posts/:postId')
        .get(withErrorLogging(getPost))
        .delete(withErrorLogging(deletePost))
        .put(jsonParser, withErrorLogging(updatePost))
      app
        .route('/posts/:postId/comments')
        .get(withErrorLogging(getCommentsForPost))
        .post(jsonParser, withErrorLogging(addComment))
      app
        .route('/posts/:postId/comments/:commentIdx')
        .get(withErrorLogging(getComment))
        .delete(withErrorLogging(deleteComment))
        .put(jsonParser, withErrorLogging(updateComment))
      app
        .route('/authors/')
        .get(withErrorLogging(getAuthors))
        .post(jsonParser, withErrorLogging(addAuthor))
      app
        .route('/authors/:authorId')
        .get(withErrorLogging(getAuthor))
        .delete(withErrorLogging(deleteAuthor))
        .put(jsonParser, withErrorLogging(updateAuthor))
      app
        .route('/authors/:authorId/posts')
        .get(withErrorLogging(getPostsForAuthor))
      app
        .route('/authors/:authorId/comments')
        .get(withErrorLogging(getCommentsForAuthor))

      return stoppable(http.createServer(app), 0)
    }).then(srv => {
      server = Just(srv)
      return `http://localhost:${srv.address().port}`
    }),
  stop: async () => {
    server.map(async s => {
      await new Promise(resolve => s.stop(resolve))
      server = Nothing()
    })
  }
}
