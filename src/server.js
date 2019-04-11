'use strict';

const knex = require('knex');
const app = require('./app');
const { PORT, DB_URL } = require('./config');

/* 
db of course stands for database. We are referencing a 'pg'
or postgres database. Here we are linking the knex library to
our bookmarks database. The bookmarks database is located in 
.env, which is then captured in config.js. Here we reference 
config.js to reference the database. 
*/
const db = knex({
  client: 'pg',
  connection: DB_URL,
});

/* 
app.set() refers to the app.js export, which
is a modified express server. App is not a clean instance
of express(). Instead it is the version of express after everything
is set in app.js. So all middlware, routing, etc. is already in place.
Any time req.app.get('db') is called, we are referencing the database
that has been set in .env. The syntax may be strange, but that's just the
way it is.
 */
app.set('db', db);

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
