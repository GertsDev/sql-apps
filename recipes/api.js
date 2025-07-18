const path = require("path");
const express = require("express");
const router = express.Router();
const pg = require("pg");

// client side static assets
router.get("/", (_, res) => res.sendFile(path.join(__dirname, "./index.html")));
router.get("/client.js", (_, res) =>
  res.sendFile(path.join(__dirname, "./client.js"))
);
router.get("/detail-client.js", (_, res) =>
  res.sendFile(path.join(__dirname, "./detail-client.js"))
);
router.get("/style.css", (_, res) =>
  res.sendFile(path.join(__dirname, "../style.css"))
);
router.get("/detail", (_, res) =>
  res.sendFile(path.join(__dirname, "./detail.html"))
);

/**
 * Student code starts here
 */

const pool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "recipeguru",
  password: "lol",
  port: "5432",
});

router.get("/search", async function (req, res) {
  console.log("search recipes");

  const query = `SELECT
  recipe_id,
  title,
  COALESCE(url, 'default.jpg') AS url
FROM (
  SELECT
    r.recipe_id,
    r.title,
    rp.url,
    ROW_NUMBER() OVER (
      PARTITION BY r.recipe_id
      ORDER BY rp.url DESC -- DESC for "last" (reverse order)
    ) AS rn
  FROM recipes r
  LEFT JOIN recipes_photos rp ON rp.recipe_id = r.recipe_id
) ranked
WHERE rn = 1`;

  try {
    const { rows } = await pool.query(query);
    res.json({ status: "OK", rows });
  } catch (err) {
    console.error("search recipes", err);
  }

  // return recipe_id, title, and the first photo as url
  //
  // for recipes without photos, return url as default.jpg
});

router.get("/get", async (req, res) => {
  const recipeId = req.query.id ? +req.query.id : 1;
  console.log("recipe get", recipeId);

  // return all ingredient rows as ingredients
  //    name the ingredient image `ingredient_image`
  //    name the ingredient type `ingredient_type`
  //    name the ingredient title `ingredient_title`
  //
  //
  // return all photo rows as photos
  //    return the title, body, and url (named the same)
  //
  //
  // return the title as title
  // return the body as body
  // if no row[0] has no photo, return it as default.jpg

  res.status(501).json({ status: "not implemented" });
});
/**
 * Student code ends here
 */

module.exports = router;
