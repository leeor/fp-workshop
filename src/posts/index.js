'use strict'

const find = require('crocks/Maybe/find')
const prop = require('crocks/Maybe/prop')
const safe = require('crocks/Maybe/safe')
const { Ok } = require('crocks/Result')
const maybeToResult = require('crocks/Result/maybeToResult')
const {
  assign,
  compose,
  curry,
  defaultProps,
  pipeK
} = require('crocks/helpers')
const { flip } = require('crocks/combinators')
const { sequence } = require('crocks/pointfree')

const R = require('ramda')

const {
  appendToList,
  createResponder,
  findIdxById,
  matchId,
  readAuthors,
  readPosts,
  readSiteData,
  removeItemById,
  setPosts,
  updateItemAtIndex,
  updateSiteData
} = require('../utils')

// findPostById :: PostId -> [Posts] -> Result ErrorCode Post
const findPostById = curry(postId => maybeToResult(404, find(matchId(postId))))

// [Author] -> Post -> Result ErrorCode Post
const validateExistingAuthor = authors =>
  maybeToResult(
    401,
    safe(post => authors.map(({ id }) => id).includes(post.author))
  )

// validatePost :: Post -> Result ErrorCode Post
const validatePost = maybeToResult(
  400,
  safe(post => typeof post.title === 'string' && typeof post.body === 'string')
)

// [Post] -> Post -> Result ErrorCode Post
const validateNewPost = posts =>
  maybeToResult(400, safe(post => !isExistingPostId(getPostId(post), posts)))

// [Post] -> Post -> Result ErrorCode Post
const validateExistingPost = posts =>
  maybeToResult(400, safe(post => isExistingPostId(post.id, posts)))

// { post } -> Result ErrorCode Post
const readPost = maybeToResult(400, prop('post'))

// getPostId :: { title } -> String
const getPostId = post => post.title.toLowerCase().replace(/ /g, '-')

// PostId -> [Post] -> Boolean
const isExistingPostId = curry(
  compose(
    R.any,
    matchId
  )
)

// withRequiredProps :: Post -> Post
const withRequiredProps = curry(post =>
  assign(
    {
      id: getPostId(post)
    },
    defaultProps(
      {
        comments: []
      },
      post
    )
  )
)

// readPostIdIfExists :: [Post] -> PostId -> Result ErrorCode PostId
const readPostIdIfExists = curry(posts =>
  maybeToResult(404, safe(flip(isExistingPostId)(posts)))
)

// readNewPostByExistingAuthor :: [Post] -> [Author] -> { post } -> Result ErrorCode Post
const readNewPostByExistingAuthor = curry((posts, authors) =>
  pipeK(
    readPost,
    validatePost,
    validateNewPost(posts),
    validateExistingAuthor(authors)
  )
)

// readExistingPostByExistingAuthor :: [Post] -> [Author] -> { post } -> Result ErrorCode Post
const readExistingPostByExistingAuthor = curry((posts, authors) =>
  pipeK(
    readPost,
    validatePost,
    validateExistingPost(posts),
    validateExistingAuthor(authors)
  )
)

// updateSiteDataAndReturnPostId :: (SiteData -> SiteData) -> Post -> Request -> { postId }
const updateSiteDataAndReturnPostId = (updateDataFn, postWithDefaults, req) =>
  sequence(Ok, [updateDataFn, postWithDefaults]).map(([updateFn, post]) => {
    updateSiteData(req, updateFn)
    return { postId: post.id }
  })

/*
 * Here be Handlers
 */

const getPost = (req, res) => {
  const respond = createResponder(res, 200)

  const siteData = readSiteData(req)
  const posts = readPosts(siteData)
  const { postId } = req.params

  const post = findPostById(postId, posts)

  respond(post)
}

const getPosts = (req, res) => {
  const respond = createResponder(res, 200)

  const siteData = readSiteData(req)
  const posts = readPosts(siteData)

  respond(Ok(posts))
}

const addPost = (req, res) => {
  const respond = createResponder(res, 200)

  const siteData = readSiteData(req)
  const posts = readPosts(siteData)
  const authors = readAuthors(siteData)

  const post = readNewPostByExistingAuthor(posts, authors, req.body)

  const postWithDefaults = post.map(withRequiredProps)
  const updatedPosts = postWithDefaults.map(appendToList(posts))
  const updateDataFn = updatedPosts.map(setPosts)

  respond(updateSiteDataAndReturnPostId(updateDataFn, postWithDefaults, req))
}

const deletePost = (req, res) => {
  const respond = createResponder(res, 200)

  const siteData = readSiteData(req)
  const posts = readPosts(siteData)

  const postId = readPostIdIfExists(posts, req.params.postId)

  const updatedPosts = postId.map(removeItemById(posts))
  const updateDataFn = updatedPosts.map(setPosts)

  respond(updateDataFn.map(updateSiteData(req)))
}

const updatePost = (req, res) => {
  const respond = createResponder(res, 200)

  const siteData = readSiteData(req)
  const posts = readPosts(siteData)
  const authors = readAuthors(siteData)

  const post = readExistingPostByExistingAuthor(posts, authors, req.body)
  const postIdx = findIdxById(req.params.postId, posts)

  const postWithDefaults = post.map(withRequiredProps)
  const updatedPosts = updateItemAtIndex(postIdx, postWithDefaults, Ok(posts))
  const updateDataFn = updatedPosts.map(setPosts)

  respond(updateSiteDataAndReturnPostId(updateDataFn, postWithDefaults, req))
}

module.exports = {
  addPost,
  getPost,
  getPosts,
  deletePost,
  updatePost
}
