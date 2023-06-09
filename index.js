import { createRequire } from "module";
const require = createRequire(import.meta.url);
const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const cors = require("cors");
const app = express();

const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const { convertCsvToXlsx } = require("@aternus/csv-to-xlsx");
import { options } from "./swagger.js";
import { mainFlow } from "./utils.js";
const Diacritics = require("diacritic");
const timestamp = Math.floor(Date.now() / 1000);

const baseUrl = "https://hosocongty.vn/"; // the website url to start scraping from
const specs = swaggerJsdoc(options);
app.use(cors());
app.use("/api", swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * tags:
 *  name: API
 *  description: Get data information
 */

/**
 * @swagger
 *  /:
 *   get:
 *    description: Get data information
 *    tags: [API]
 *    responses:
 *     200:
 *      description: Get data all pagination.
 *      contents:
 *        application/json:
 *     400:
 *      $ref: '#/responses/400'
 *     401:
 *      $ref: '#/responses/401'
 *     404:
 *      $ref: '#/responses/404'
 */
app.get("/", async (req, res) => {
  // Write Headers
  const main = mainFlow();
  console.log("main", await main);

  // res.json(main);
  res.send("Hello World!");
});

/**
 * @swagger
 *  /{city}/{district}:
 *   get:
 *    description: Get data information
 *    tags: [API]
 *    parameters:
 *      - in: path
 *        name: city
 *        schema:
 *          type: string
 *        required: true
 *        description: The city name. Letters separated by dash.
 *      - in: path
 *        name: district
 *        schema:
 *          type: string
 *        required: false
 *        description: The district name. Letters separated by dash. If not provided, all districts will be returned.
 *    responses:
 *     200:
 *      description: Get data all pagination of city - district.
 *      contents:
 *        application/json:
 *     400:
 *      $ref: '#/responses/400'
 *     401:
 *      $ref: '#/responses/401'
 *     404:
 *      $ref: '#/responses/404'
 */
app.get("/:city/:district", async (req, res) => {
  const { city, district } = req.params;
  if (city.trim().length === 0) {
    res.status(400).json({ message: "City is require" });
  }

  if (!city && district) {
    res.status(400).json({ message: "City is require" });
  }
  //read file json
  console.log(city);
  console.log(Diacritics.clean(city));

  const data = fs.readFileSync("data.json", "utf8");
  const dataJson = JSON.parse(data);
  const cityData = dataJson.find((item) => {
    if (item["codename"] === city) {
      return item;
    }
  });
  if (!cityData) {
    res.status(404).json({
      message: `${city} not found, please fill in the correct format city name and try again.`,
    });
  }
  if (cityData && district) {
    const districtData = cityData["districts"]["districts"].find((item) => {
      if (item["codename"] == district) {
        return item;
      }
    });
    if (!districtData) {
      // throw new Error('Another error occurred');
      res.status(404).json({
        message: `${district} not found, please fill in the correct format district name and try again.`,
      });
    }
  }
  if (!district) {
    district = "";
  }
  let url = `${baseUrl}/p/${city}/${district}`;
  // const main = mainFlow(url);
});

/**
 * @swagger
 *  /convert:
 *   get:
 *    description: Convert csv to xlsx
 *    tags: [API]
 *    responses:
 *     200:
 *      description: Convert file csv to xlsx successully.
 *      contents:
 *        application/json:
 *     400:
 *      $ref: '#/responses/400'
 *     401:
 *      $ref: '#/responses/401'
 *     404:
 *      $ref: '#/responses/404'
 */
app.get("/convert", async (req, res) => {
  try {
    convertCsvToXlsx(`data.csv`, `data_${timestamp}.xlsx`);
    res.send("convert success");
  } catch (error) {
    console.log(error);
  }
});

//get city and districts vietnam
app.get("/get-city-districts", async (req, res) => {
  const result = [];
  const promises = [];
  axios.get("https://provinces.open-api.vn/api/p").then((response) => {
    const data = response.data;
    // res.json(data);

    for (const value of data) {
      const promise = axios
        .get(`https://provinces.open-api.vn/api/p/${value.code}?depth=2`)
        .then((response) => {
          value["districts"] = response.data;
          result.push(value);
        });
      promises.push(promise);
    }
    Promise.all(promises).then(() => {
      // all the fetch requests have completed, and the results are in the "results" array

      //save file json
      fs.writeFile(`data.json`, JSON.stringify(result), function (err) {
        if (err) throw err;
        console.log("Saved!");
      });
      // res.json(result);
    });
  });
});

app.listen(3002, () => console.log("Run server"));
