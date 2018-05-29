# Used libraries

The CrossCloud Admin Console API uses the following libraries:

* [Koa](https://github.com/koajs/koa) - version 2.x is used
([https://github.com/koajs/koa#koa-v2])
* [GraphQL.js](https://github.com/graphql/graphql-js) - the JavaScript reference
implementation for GraphQL
* [GraphQL-tools](https://github.com/apollographql/graphql-tools) - allows
to define GraphQL.js schema using [the schema language]((http://graphql.org/learn/schema/))
* [GraphQL Server](https://github.com/apollographql/graphql-server) - provides
a GraphQL middleware for Koa
* [Babel](http://babeljs.io) - there are ES6+ constructs used in the source
code not yet supported by Node (e.g. ES6 imports) so Babel is used for
transformation
* [knex.js](https://github.com/tgriesser/knex) - for accessing database
* [DataLoader](https://github.com/facebook/dataloader) - for optimizing database
access
* [bcrypt.js](https://github.com/dcodeIO/bcrypt.js) - for password hashing
* [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - for generating
tokens used for authorization
* multiple Koa middlewares for routing, serving static files in production
and logging

# Source code structure

Folders:

* _migrations/_ - [knex database migrations](http://knexjs.org/#Migrations)
* _scripts/_ - some data management scripts (e.g. adding users and organizations)
* _src/_ - the actual source code of the server
* _src/handlers/_ - the code of the REST handlers other than GraphQL (currently
only authorization)
* _src/stats/_ - the code of the _Stats_ graphql type (schema and models)
* _src/utils/_ - utility fuctions
* _src/index.js_ - a starting module of the server
* _src/models.js_ - models as described below
* _src/schema.js_ - schema and resolvers as described below

# Schema, models and resolvers

The GraphQL schema is described using
[the GraphQL type language](http://graphql.org/learn/schema/).
The resolvers are defined in the same file as schema (schema.js).
There is a separation between resolvers and models - resolvers are
usually simple functions which invoke corresponding functions in models.
Connectors are currently not separated in any special way. Knex library
is used together with DataLoader for querying the database. For more explanation
look at the article:
[How to build GraphQL servers](https://dev-blog.apollodata.com/how-to-build-graphql-servers-87587591ded5#.4y75gsfbv)
(pt. _2. Choose the right abstractions_ and _3. Structure your code with Models and Connectors_).
