'use strict'

const { Err, Ok } = require('crocks/Result')
const maybeToResult = require('crocks/Result/maybeToResult')
const propPath = require('crocks/maybe/propPath')
const prop = require('crocks/maybe/prop')
const safe = require('crocks/maybe/safe')
const { curry } = require('crocks/helpers')
const { sequence } = require('crocks/pointfree')

const R = require('ramda')

const {
  appendToList,
  createResponder,
  findIdxById,
  readAuthors,
  readPosts,
  readSiteData,
  setComments,
  setPosts,
  updateItemAtIndex,
  updateSiteData
} = require('../utils')

// validateComment :: [Author] -> Comment -> Result ErrorCode Comment
const validateComment = authors =>
  maybeToResult(
    401,
    safe(
      comment =>
        typeof comment.body === 'string' &&
        authors.map(({ id }) => id).includes(comment.author)
    )
  )

// readComment :: { comment } -> Result ErrorCode Comment
const readComment = maybeToResult(400, prop('comment'))

// isExistingComment :: [Comment] -> Index -> Boolean
const isExistingComment = curry((comments, index) => index < comments.length)

// getCommentIdx :: [Comment] -> Index -> Result Number Index
const getCommentIdx = curry(comments =>
  maybeToResult(404, safe(isExistingComment(comments)))
)

// getCommentByIdx :: Index -> [Comment] -> Comment
const getCommentByIdx = curry(index => maybeToResult(404, prop(Number(index))))

// getCommentsByPostIdx :: [Post] -> Index -> Result ErrorCode Comment
const getCommentsByPostIdx = curry((posts, index) =>
  propPath([index, 'comments'], posts).either(() => Err(500), Ok)
)

// appendComment :: Result e [Comment] -> Result e Comment -> Result e [Comment]
const appendComment = curry((currentComments, newComment) =>
  sequence(Ok, [currentComments, newComment]).map(args => appendToList(...args))
)

// removeCommentAtIndex = Result e Index -> Result e [Comment] -> Result e [Comment]
const removeCommentAtIndex = curry((index, comments) =>
  sequence(Ok, [comments, index]).map(([comments, index]) =>
    R.remove(index, 1, comments)
  )
)

const updateCommentsOfPost = curry((postIdx, updatedComments, posts) => {
  const updatedPost = sequence(Ok, [updatedComments, postIdx]).map(
    ([comments, index]) => setComments(comments, posts[index])
  )

  const updatedPosts = updateItemAtIndex(postIdx, updatedPost, Ok(posts))
  return updatedPosts.map(setPosts)
})

/*
 * Here be Handlers
 */

const addComment = (req, res) => {
  const respond = createResponder(res, 200)

  const siteData = readSiteData(req)
  const posts = readPosts(siteData)
  const authors = readAuthors(siteData)

  const { postId } = req.params
  const postIdx = findIdxById(postId, posts)

  const currentComments = postIdx.chain(getCommentsByPostIdx(posts))
  const newComment = readComment(req.body).chain(validateComment(authors))
  const updatedComments = appendComment(currentComments, newComment)
  const updateDataFn = updateCommentsOfPost(postIdx, updatedComments, posts)

  respond(
    updateDataFn
      .map(updateSiteData(req))
      .chain(() =>
        updatedComments.map(comments => ({ commentIdx: comments.length - 1 }))
      )
  )
}

const deleteComment = (req, res) => {
  const respond = createResponder(res, 200)

  const siteData = readSiteData(req)
  const posts = readPosts(siteData)

  const { postId } = req.params
  const postIdx = findIdxById(postId, posts)

  const currentComments = postIdx.chain(getCommentsByPostIdx(posts))
  const commentIdx = currentComments.chain(comments =>
    getCommentIdx(comments, Number(req.params.commentIdx))
  )

  const updatedComments = removeCommentAtIndex(commentIdx, currentComments)
  const updateDataFn = updateCommentsOfPost(postIdx, updatedComments, posts)

  respond(updateDataFn.map(updateSiteData(req)))
}

const getComment = (req, res) => {
  const respond = createResponder(res, 200)

  const siteData = readSiteData(req)
  const posts = readPosts(siteData)

  const { commentIdx, postId } = req.params
  const postIdx = findIdxById(postId, posts)

  const comment = postIdx
    .chain(getCommentsByPostIdx(posts))
    .chain(getCommentByIdx(commentIdx))

  respond(comment)
}

const getCommentsForPost = (req, res) => {
  const respond = createResponder(res, 200)

  const siteData = readSiteData(req)
  const posts = readPosts(siteData)

  const { postId } = req.params
  const postIdx = findIdxById(postId, posts)

  const comments = postIdx.chain(getCommentsByPostIdx(posts))

  respond(comments)
}

const updateComment = (req, res) => {
  const respond = createResponder(res, 200)

  const siteData = readSiteData(req)
  const posts = readPosts(siteData)
  const authors = readAuthors(siteData)

  const { postId } = req.params
  const postIdx = findIdxById(postId, posts)

  const updatedComment = readComment(req.body).chain(validateComment(authors))
  const currentComments = postIdx.chain(getCommentsByPostIdx(posts))
  const commentIdx = currentComments.chain(comments =>
    getCommentIdx(comments, Number(req.params.commentIdx))
  )
  const updatedComments = updateItemAtIndex(
    commentIdx,
    updatedComment,
    currentComments
  )
  const updateDataFn = updateCommentsOfPost(postIdx, updatedComments, posts)

  respond(updateDataFn.map(updateSiteData(req)))
}

module.exports = {
  addComment,
  deleteComment,
  getComment,
  getCommentsForPost,
  updateComment
}
