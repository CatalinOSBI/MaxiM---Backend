require("dotenv").config({path: __dirname + "/.env.local"});

const functions = require("firebase-functions");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const port = 1818
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// ----------------ESTABLISHING THE CONNECTION----------------//
const DB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: 25280,
  connectTimeout: 20000,
  ssl: {
    ca: fs.readFileSync(__dirname + "/ca.pem").toString(),
  },
});

console.log("Initializing Firebase FunctionService...");

app.listen(port, () =>{
  console.log(`App listening on ports ${port}...`);
});

// -----------------ERROR CATCHING-----------------//
DB.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err.stack);
    return;
  }
  console.log("Connected to database as ID", DB.threadId);
});

// -----------------GET-----------------//
app.get("/sneakers", (req, res) => {
  const SQL = "SELECT * FROM defaultdb.sneakers;";
  DB.query(SQL, (err, data) => {
    if (err) {
      return res.json(err);
    } else {
      return res.json(data);
    }
  });
});

// -----------------POST-----------------//
app.post("/sneakers", (req, res) => {
  const values = [
    req.body.type,
    req.body.release_year,
    req.body.name,
    req.body.image,
    req.body.image_noBG,
    req.body.price,
  ];
  const SQL = "INSERT INTO `defaultdb`.`sneakers` " +
  "(`type`, `release_year`, `name`, `image`, `image_noBG`, `price`) " +
  "VALUES (?);";

  DB.query(SQL, [values], (err, data) => {
    if (err) {
      return res.json(err);
    } else {
      console.log("Updated DB!");
      return res.json(data);
    }
  });
});

// -----------------DELETE-----------------//
app.delete("/sneakers/:id", (req, res) => {
  const sneakerId = req.params.id;
  const SQL = "DELETE FROM `defaultdb`.`sneakers` WHERE (`id` = ?)";
  DB.query(SQL, [sneakerId], (err, data) => {
    if (err) {
      return res.json(err);
    } else {
      console.log("Removed item from DB!");
      return res.json(data);
    }
  });
});

// -----------------PUT-----------------//
app.put("/sneakers/:id", (req, res) => {
  const sneakerId = req.params.id;
  const SQL = "UPDATE `defaultdb`.`sneakers` " +
  "SET `type` = ?, " +
  "`release_year` = ?, " +
  "`name` = ?, " +
  "`image` = ?, " +
  "`image_noBG` = ?, " +
  "`price` = ? " +
  "WHERE (`id` = ?);";
  const values = [
    req.body.type,
    req.body.release_year,
    req.body.name,
    req.body.image,
    req.body.image_noBG,
    req.body.price,
  ];

  DB.query(SQL, [...values, sneakerId], (err, data) => {
    if (err) {
      return res.json(err);
    } else {
      console.log("Updated item in DB!");
      return res.json(data);
    }
  });
});

// -----------------CUSTOM GET-----------------//
app.get("/sneakers/:id", (req, res) => {
  const sneakerId = req.params.id;
  const SQL = "SELECT * FROM defaultdb.sneakers WHERE id=?;";
  DB.query(SQL, [sneakerId], (err, data) => {
    if (err) {
      return res.json(err);
    } else {
      return res.json(data);
    }
  });
});

// -----------------CUSTOM GET (ALL FIELDS IN COLUMN)-----------------//
app.get("/sneakers3/column/:columnName", (req, res) => {
  const columnName = req.params.columnName;
  const SQL = `SELECT DISTINCT ?? FROM defaultdb.sneakers;`;
  DB.query(SQL, [columnName], (err, data) => {
    if (err) {
      return res.json(err);
    } else {
      return res.json(data);
    }
  });
});

// -----------SAME WAY MARVEL DOES IT--------------//
app.get("/sneaker2/filter", (req, res) => {
  const {type, release_year} = req.query;

  // Start with a true condition
  let query = "SELECT * FROM defaultdb.sneakers WHERE 1";
  const queryParams = [];

  if (type) {
    query += " AND type = ?";
    queryParams.push(type);
  }

  if (release_year) {
    query += " AND release_year = ?";
    queryParams.push(release_year);
  }

  DB.query(query, queryParams, (err, data) => {
    if (err) {
      return res.json(err);
    } else {
      return res.json(data);
    }
  });
});

// ------------------------------STRIPE--------------------------------------//
const stripe = require("stripe")("sk_test_51OlrifGuYcLzddVWgAIIETyA5yE3y2WlUdU0A4ghl2cVbmcqTIkV2g0Zuciemv2VfvJFmIzrPEN16lsanLBVUQO100MRLit9Qp");

app.post("/api/create-checkout-session", async (req, res) => {
  const {ShoppingCart} = req.body;
  const lineItems = ShoppingCart.map((product) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: product.name,
        images: [product.image],
      },
      unit_amount: product.price * 100, // Convert to cents
    },
    quantity: product.Quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: "https://catalinosbi.github.io/Maxim/#/Success",
    cancel_url: "https://catalinosbi.github.io/Maxim/#/cancel",
  });

  res.json({id: session.id});
});

// Ensure correct function export
exports.maximBackend = functions.https.onRequest(app);
