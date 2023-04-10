const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();

app.use(express.json());

let dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Database error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDirectorDetails = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

const convertMovieName = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

const convertMovieDetails = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

//Get Movies API
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
        SELECT *
        FROM movie
        ORDER BY movie_id;
    `;

  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((movie) => {
      return convertMovieName(movie);
    })
  );
});

//Post Player API
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const postMovieQuery = `
        INSERT INTO movie
        (director_id, movie_name, lead_actor)
        VALUES
        (${directorId}, '${movieName}', '${leadActor}');
    `;

  await db.run(postMovieQuery);
  response.send("Movie Successfully Added");
});

//Get Movie API
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
        SELECT *
        FROM movie
        WHERE movie_id = ${movieId};
    `;

  const movieDetails = await db.get(getMovieQuery);
  response.send(convertMovieDetails(movieDetails));
});

//Update Movie Details
app.put("/movies/:movieId/", async (request, response) => {
  const movieDetails = request.body;
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
    UPDATE movie
    SET 
    director_id = ${directorId}, 
    movie_name = '${movieName}', 
    lead_actor = '${leadActor}'
    WHERE movie_id = ${movieId};
  `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//Delete Movie API
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM movie
    WHERE movie_id = ${movieId};
    `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//Get Director Details
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
        SELECT *
        FROM director
        ORDER BY director_id;
    `;

  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((director) => {
      return convertDirectorDetails(director);
    })
  );
});

//Get Movie of Director API
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieOfDirectorQuery = `
        SELECT *
        FROM movie
        WHERE director_id = ${directorId};
    `;

  const moviesArray = await db.all(getMovieOfDirectorQuery);
  response.send(
    moviesArray.map((movie) => {
      return convertMovieName(movie);
    })
  );
});

module.exports = app;
