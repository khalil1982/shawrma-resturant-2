const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { app } = require("electron");

let dbInstance = null;

const getDbPath = () => {
  return path.join(app.getPath("userData"), "shawrma.db");
};

const getDb = () => {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(getDbPath());
    dbInstance.run("PRAGMA foreign_keys = ON;");
  }
  return dbInstance;
};

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

module.exports = { getDb, run, get, all };
