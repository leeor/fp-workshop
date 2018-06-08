/* eslint-env jest */
'use strict'

const request = require('supertest')
const R = require('ramda')

const siteData = require('./siteData')

const apiServer = require('../src')

const titleToPostId = title => title.toLowerCase().replace(/ /g, '-')

describe('API', function() {
  let server

  beforeEach(async () => {
    server = await apiServer.start(siteData)
  })

  afterEach(async () => {
    await apiServer.stop()
  })

  describe('posts', function() {
    describe('GET', function() {
      test('should return all blog posts', async function() {
        return request(server)
          .get('/posts')
          .expect(200, Object.values(siteData.posts))
      })

      test('should return a specific blog post when an ID is given', async function() {
        return Promise.all(
          siteData.posts.map(post => {
            const postId = post.id
            return request(server)
              .get(`/posts/${postId}`)
              .expect(200, post)
          })
        )
      })

      test('should return a 404 error response when a requested post is not found', async function() {
        return request(server)
          .get(`/posts/no-such-post`)
          .expect(404)
      })
    })

    describe('POST', function() {
      test('should add a post', async function() {
        const postTitle = 'A New Blog Post'
        const postId = titleToPostId(postTitle)
        const post = {
          title: postTitle,
          body:
            'another chapter in the adventures of Dorothy in the land of Oz',
          author: 'leeor'
        }

        await request(server)
          .post(`/posts`)
          .send({ post })
          .expect(200, { postId })

        return request(server)
          .get(`/posts/${postId}`)
          .expect(200, Object.assign({}, post, { id: postId }))
      })

      test('should return a 400 error when trying to add a post with an existing title', async function() {
        const postTitle = siteData.posts[0].title
        const post = {
          title: postTitle,
          body: 'An alternative history of Dorothy',
          author: 'leeor'
        }

        return request(server)
          .post(`/posts`)
          .send({ post })
          .expect(400)
      })

      test('should return a 400 error when trying to add an invalid post', async function() {
        const postTitle = 'A New Blog Post'
        const post = {
          title: postTitle,
          author: 'leeor'
        }

        return request(server)
          .post(`/posts`)
          .send({ post })
          .expect(400)
      })

      test('should reject with a 401 error a new blog post by unknown author', async function() {
        const postTitle = 'A New Blog Post'
        const post = {
          title: postTitle,
          body:
            'another chapter in the adventures of Dorothy in the land of Oz',
          author: 'unknown'
        }

        return request(server)
          .post(`/posts`)
          .send({ post })
          .expect(401)
      })
    })

    describe('PUT', function() {
      test('should update a post', async function() {
        const postToUpdate = siteData.posts[0].id
        const updatedPost = Object.assign({}, siteData.posts[0], {
          body: 'Updated post body'
        })

        await request(server)
          .put(`/posts/${postToUpdate}`)
          .send({ post: updatedPost })
          .expect(200, { postId: postToUpdate })

        return request(server)
          .get(`/posts/${postToUpdate}`)
          .expect(200, updatedPost)
      })

      test('should update the post ID if the title is changed', async function() {
        const postToUpdate = siteData.posts[0].id
        const updatedPostTitle = 'A Changed Title'
        const updatedPost = Object.assign({}, siteData.posts[0], {
          title: updatedPostTitle
        })
        const updatedPostId = titleToPostId(updatedPostTitle)

        await request(server)
          .put(`/posts/${postToUpdate}`)
          .send({ post: updatedPost })
          .expect(200, { postId: updatedPostId })

        return request(server)
          .get(`/posts/${updatedPostId}`)
          .expect(200, Object.assign({}, updatedPost, { id: updatedPostId }))
      })

      test('should return 404 error when trying to update a non-existing post', async function() {
        const postToUpdate = R.reverse(siteData.posts[0].id)
        const updatedPost = Object.assign({}, siteData.posts[0], {
          body: 'Updated post body'
        })

        return request(server)
          .put(`/posts/${postToUpdate}`)
          .send({ post: updatedPost })
          .expect(404)
      })

      test('should return a 400 error when trying to update with an invalid post', async function() {
        const postToUpdate = siteData.posts[0].id
        const updatedPost = R.pick(['title'], siteData.posts[0])

        return request(server)
          .put(`/posts/${postToUpdate}`)
          .send({ post: updatedPost })
          .expect(400)
      })
    })

    describe('DELETE', function() {
      test('should remove a post', async function() {
        const postToDelete = siteData.posts[0].id

        await request(server)
          .delete(`/posts/${postToDelete}`)
          .expect(200)

        return request(server)
          .get(`/posts/${postToDelete}`)
          .expect(404)
      })

      test('should return a 404 error when asked to delete a non existing post', async function() {
        const postToDelete = R.reverse(siteData.posts[0].id)

        return request(server)
          .delete(`/posts/${postToDelete}`)
          .expect(404)
      })
    })
  })

  describe('authors', function() {
    describe('GET', function() {
      test('should return all authors', async function() {
        return request(server)
          .get(`/authors`)
          .expect(200, siteData.authors)
      })

      test('should return a specific author', async function() {
        return Promise.all(
          siteData.authors.map(author => {
            const authorId = author.id
            return request(server)
              .get(`/authors/${authorId}`)
              .expect(200, author)
          })
        )
      })

      test('should return a 404 error when requesting a non-existing author', async function() {
        const author = R.reverse(siteData.authors[0])
        const authorId = author.id
        return request(server)
          .get(`/authors/${authorId}`)
          .expect(404)
      })
    })

    describe('POST', function() {
      test('should add an author', async function() {
        const authorId = 'guy'
        const author = {
          id: authorId,
          displayName: 'new guy'
        }

        await request(server)
          .post(`/authors`)
          .send({ author })
          .expect(200, { authorId })

        return request(server)
          .get(`/authors/${authorId}`)
          .expect(200, author)
      })

      test('should return a 400 error when trying to add an existing author', async function() {
        const authorId = siteData.authors[0].id
        const author = {
          id: authorId,
          displayName: 'new guy'
        }

        return request(server)
          .post(`/authors`)
          .send({ author })
          .expect(400)
      })

      test('should return a 400 error when trying to add an invalid author', async function() {
        const authorId = 'guy'
        const author = {
          id: authorId
        }

        return request(server)
          .post(`/authors`)
          .send({ author })
          .expect(400)
      })
    })

    describe('PUT', function() {
      test('should update an author', async function() {
        const authorId = siteData.authors[0].id
        const author = {
          id: authorId,
          displayName: 'newer guy'
        }

        await request(server)
          .put(`/authors/${authorId}`)
          .send({ author })
          .expect(200)

        return request(server)
          .get(`/authors/${authorId}`)
          .expect(200, Object.assign({}, author))
      })

      test('should return a 404 error when trying to update a non-existing author', async function() {
        const authorId = R.reverse(siteData.authors[0].id)
        const author = {
          id: authorId,
          displayName: 'newer guy'
        }

        await request(server)
          .put(`/authors/${authorId}`)
          .send({ author })
          .expect(404)
      })

      test('should return a 400 error when trying to update with an invalid author', async function() {
        const authorId = siteData.authors[0].id
        const author = {
          id: authorId
        }

        return request(server)
          .put(`/authors/${authorId}`)
          .send({ author })
          .expect(400)
      })
    })

    describe('DELETE', function() {
      test('should delete a specific author and all related content', async function() {
        const author = siteData.authors[0]
        const authorId = author.id
        await request(server)
          .delete(`/authors/${authorId}`)
          .expect(200)

        await request(server)
          .get(`/authors/${authorId}`)
          .expect(404)

        return request(server)
          .get(`/authors/${authorId}/posts`)
          .expect(200, [])
      })

      test('should return a 404 error when deleting a non-existing author', async function() {
        const authorId = R.reverse(siteData.authors[0].id)
        return request(server)
          .delete(`/authors/${authorId}`)
          .expect(404)
      })
    })

    test('should return all posts for a given author', async function() {
      return Promise.all(
        siteData.authors.map(author => {
          const authorId = author.id
          const postsByAuthor = siteData.posts.filter(
            post => post.author === authorId
          )

          return request(server)
            .get(`/authors/${authorId}/posts`)
            .expect(200, postsByAuthor)
        })
      )
    })
  })
})
