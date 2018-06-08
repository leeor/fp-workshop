'use strict'

const { Ok } = require('crocks/Result')
const safe = require('crocks/Maybe/safe')
const maybeToResult = require('crocks/Result/maybeToResult')
const { either, sequence } = require('crocks/pointfree')
const { flip } = require('crocks/combinators')
const { assoc, curry, pipe } = require('crocks/helpers')

const R = require('ramda')

// appendToList :: [a] -> a -> [a]
const appendToList = flip(R.append)

// createResponder :: Response -> Number -> Result ErrorCode a -> ()
const createResponder = curry((response, successCode) =>
  either(
    errorCode => {
      response.status(errorCode)
      response.end()
    },
    body => {
      response.status(successCode)
      body ? response.send(body) : response.end()
    }
  )
)

// findIdxById :: Id -> [{ id }] -> Result ErrorCode Index
const findIdxById = curry(id =>
  maybeToResult(
    404,
    pipe(
      R.findIndex(matchId(id)),
      safe(idx => idx >= 0)
    )
  )
)

// matchProp = String -> a -> Object -> Boolean
const matchProp = curry(
  (propName, propValue, obj) => obj[propName] === propValue
)

// matchId :: a -> { id } -> Boolean
const matchId = matchProp('id')

// removeItemById :: [Post] -> String -> [Post]
const removeItemById = curry((items, itemId) =>
  R.reject(matchId(itemId), items)
)

// updatePostAtIndex :: Result e Index -> Result e a -> Result e [a] -> Result e [a]
const updateItemAtIndex = curry((index, item, list) =>
  sequence(Ok, [index, item, list]).map(args => R.update(...args))
)

// updateSiteData :: SiteData -> (SiteData -> SiteData) -> ()
const updateSiteData = curry((req, updateFn) => {
  req.siteData.data = updateFn(req.siteData.data)
})

// readSiteData :: Request -> SiteData
const readSiteData = req => req.siteData.data

// getPosts :: SiteData -> [Post]
const readPosts = ({ posts }) => posts

// getAuthors :: SiteData -> [Author]
const readAuthors = ({ authors }) => authors

// setPosts :: [Post] -> Object -> Object
const setPosts = assoc('posts')

// setComments :: [Comment] -> Object -> Object
const setComments = assoc('comments')

// setAuthors :: [Author] -> Object -> Object
const setAuthors = assoc('authors')

module.exports = {
  appendToList,
  createResponder,
  findIdxById,
  matchId,
  matchProp,
  readAuthors,
  readPosts,
  readSiteData,
  removeItemById,
  setAuthors,
  setComments,
  setPosts,
  updateItemAtIndex,
  updateSiteData
}
