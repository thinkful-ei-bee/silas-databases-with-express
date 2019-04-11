'use strict';

const express = require('express');
const { isWebUri } = require('valid-url');
const xss = require('xss');
const logger = require('../logger');
const BookmarksService = require('./bookmarks-service');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: xss(bookmark.url),
  description: xss(bookmark.description),
  rating: xss(Number(bookmark.rating)),
});

/* 
express.Router():
bookmarksRouter is the express method to hook up seperate endpoints
The challenge here is to initiate the enpoints to handle data from
the local database, rather than a set of data located within the app.

When a get request is made to the /bookmarks endpoint, the BookmarksService
object is referenced. From here we simply return all data within the bookmarks
database. 

the getAllBookmarks function takes one argument: a knex instance of a database.
Our 'app' is already set to a database. This is located in the server.js. 
*/
bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(response => {
        response.json();
      })
      .catch(next);
  })
  /*
  when posting anything, it needs to be converted to json data. That is where
  body parser, or express.json() comes in handy. 
   */
  .post(bodyParser, (req, res, next) => {
    for (const field of ['title', 'url', 'rating']) { // This checks for ALL 3 properties
      if (!req.body[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send(`${field} is required`);
      }
    }

    // If the post request is valid...
    const { title, url, description, rating } = req.body;

    // Check for valid types...
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Rating is not valid: ${rating}`);
      res.status(404).send('Rating must be a number between 0 and 5');
    }

    if (!isWebUri(url)) {
      logger.error(`Invalid URL: ${url}`);
      res.status(404).send('Invalid URL');
    }

    // If each type is valid...
    const newBookmark = {title, url, description, rating};

    BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
      .then(bookmark => {
        res
          .status(201)
          .location(`bookmarks/${bookmark.id}`)
          .json(serializeBookmark(bookmark));
      })
      .catch(next);
  });

bookmarksRouter
  .route('/bookmarks/:bookmark_id')
  .all((req, res, next) => {
    const { bookmark_id } = req.body;
    BookmarksService.getById(res.app.get('db'), bookmark_id)
      .then(response => {
        if (!response) {
          logger.error('No response');
          res.status(404).json();
        }
        res.bookmark = response;
        res.next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(serializeBookmark(res.bookmark));
  })
  .delete((req, res, next) => {
    const { bookmark_id } = req.body;
    BookmarksService.deleteBookmark(req.app.get('db'), bookmark_id)
      .then(response => {
        logger.info(`Bookmark with id ${bookmark_id} was deleted`);
        res.status(204).end();
      })
      .catch(next);
  });


// bookmarksRouter
//   .route('/bookmarks')
//   .get((req, res, next) => {
//     BookarksService.getAllBookmarks(req.app.get('db'))
//       .then(bookmarks => {
//         res.json(bookmarks.map(serializeBookmark));
//       })
//       .catch(next);
//   })
//   .post(bodyParser, (req, res, next) => {
//     for (const field of ['title', 'url', 'rating']) {
//       if (!req.body[field]) {
//         logger.error(`${field} is required`);
//         return res.status(400).send(`'${field}' is required`);
//       }
//     }

//     const { title, url, description, rating } = req.body;

    // if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
    //   logger.error(`Invalid rating '${rating}' supplied`);
    //   return res.status(400).send('\'rating\' must be a number between 0 and 5');
    // }

    // if (!isWebUri(url)) {
    //   logger.error(`Invalid url '${url}' supplied`);
    //   return res.status(400).send('\'url\' must be a valid URL');
    // }

//     const newBookmark = { title, url, description, rating };

//     BookarksService.insertBookmark(
//       req.app.get('db'),
//       newBookmark
//     )
//       .then(bookmark => {
//         logger.info(`Card with id ${bookmark.id} created.`);
//         res
//           .status(201)
//           .location(`/bookmarks/${bookmark.id}`)
//           .json(serializeBookmark(bookmark));
//       })
//       .catch(next);
//   });

// bookmarksRouter
//   .route('/bookmarks/:bookmark_id')
//   .all((req, res, next) => {
//     const { bookmark_id } = req.params;
//     BookarksService.getById(req.app.get('db'), bookmark_id)
//       .then(bookmark => {
//         if (!bookmark) {
//           logger.error(`Bookmark with id ${bookmark_id} not found.`);
//           return res.status(404).json({
//             error: { message: 'Bookmark Not Found' }
//           });
//         }
//         res.bookmark = bookmark;
//         next();
//       })
//       .catch(next);

//   })
//   .get((req, res) => {
//     res.json(serializeBookmark(res.bookmark));
//   })
//   .delete((req, res, next) => {
//     // TODO: update to use db
//     const { bookmark_id } = req.params;
//     BookarksService.deleteBookmark(
//       req.app.get('db'),
//       bookmark_id
//     )
//       .then(numRowsAffected => {
//         logger.info(`Card with id ${bookmark_id} deleted.`);
//         res.status(204).end();
//       })
//       .catch(next);
//   });

module.exports = bookmarksRouter;
