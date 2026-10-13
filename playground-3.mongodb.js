/* global use, db */
// Read-only connectivity check for the Dr. Golechas development database.
// Select the MongoDB connection for the local mongod at 127.0.0.1:27017.
use("dr_golechas");

const ping = db.runCommand({ ping: 1 });
const collections = db
  .getCollectionNames()
  .sort()
  .map((name) => ({ name }));

console.log(
  JSON.stringify(
    {
      database: db.getName(),
      connected: ping.ok === 1,
      collections,
    },
    null,
    2,
  ),
);
