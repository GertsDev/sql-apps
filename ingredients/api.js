const path = require("path");
const express = require("express");
const router = express.Router();
const pg = require("pg");

// client side static assets
router.get("/", (_, res) => res.sendFile(path.join(__dirname, "./index.html")));
router.get("/client.js", (_, res) =>
  res.sendFile(path.join(__dirname, "./client.js"))
);

/**
 * Student code starts here
 */

// connect to postgres
const pool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "recipeguru",
  password: "lol",
  port: 5432,
});

router.get("/type", async (req, res) => {
  const { type } = req.query;
  const { rows } = await pool.query(`SELECT * FROM ingredients WHERE type=$1`, [
    type,
  ]);

  res.status(200).json({ status: "OK", rows });
});

router.get("/search", async (req, res) => {
  let { term, page } = req.query;
  page = page ? page : 0;
  let whereClause = "";

  const params = [page * 5];

  if (term) {
    whereClause = `WHERE title ILIKE $2`;
    params.push(`%${term}%`);
  }

  console.log(params);
  const sql = `SELECT *, COUNT(*) OVER()::INT AS total_type FROM ingredients ${whereClause} LIMIT 5 OFFSET $1`;
  console.log(sql);

  const { rows } = await pool.query(sql, params);

  // return all columns as well as the count of all rows as total_count
  // make sure to account for pagination and only return 5 rows at a time

  res.status(200).json({ status: "OK", rows });
});

/**
 * Student code ends here
 */

module.exports = router;
