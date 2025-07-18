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

  const recipeBodyAndTitleQuery = `
  SELECT
   title,
   body
 FROM
 recipes
 WHERE recipe_id = $1`;

  const recipePhotosQuery = `
 SELECT
 url
FROM
recipes_photos
WHERE recipe_id = $1
`;

  const recipeIngredientsQuery = `
SELECT
i.title AS ingredient_title,
i.type AS ingredient_type,
i.image AS ingredient_image
FROM ingredients i
INNER JOIN recipe_ingredients ri ON ri.ingredient_id = i.id
WHERE ri.recipe_id = $1
`;

  try {
    const [recipeBodyAndTitle, recipePhotos, recipeIngredients] =
      await Promise.all([
        pool.query(recipeBodyAndTitleQuery, [recipeId]),
        pool.query(recipePhotosQuery, [recipeId]),
        pool.query(recipeIngredientsQuery, [recipeId]),
      ]);

    if (recipeBodyAndTitle.rows.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const photos = recipePhotos.rows.map((photo) => photo.url);
    const ingredients = recipeIngredients.rows;
    const recipe = {
      ...recipeBodyAndTitle.rows[0],
      photos: photos.length > 0 ? photos : ["default.jpg"],
      ingredients,
    };
    res.status(200).json(recipe);
  } catch (error) {
    console.error("Error fetching recipe: ", error);
    //res.status(500).json({ error: "Internal server error" });
  }

  const singleQuery = `SELECT
  r.title,
  r.body,
  COALESCE(
    (SELECT array_agg(rp.url) FROM recipes_photos rp WHERE rp.recipe_id = r.recipe_id),
    ARRAY['default.jpg']::text[]
  ) AS photos,
  (SELECT json_agg(json_build_object(
    'ingredient_title', i.title,
    'ingredient_type', i.type,
    'ingredient_image', i.image
  ))
  FROM ingredients i
  INNER JOIN recipe_ingredients ri ON ri.ingredient_id = i.id
  WHERE ri.recipe_id = r.recipe_id
  ) AS ingredients
FROM recipes r
WHERE r.recipe_id = $1`;

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

  //res.status(200).json(rows);
});
/**
 * Student code ends here
 */

module.exports = router;
