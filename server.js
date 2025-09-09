const express = require("express");
const bodyParser = require("body-parser"); /* deprecated */
const cors = require("cors");
const path = require("path");
const mysql = require("mysql");

const fs = require("fs");
fs.readFile("data.json", (error, data) => {
    if (error) {
        fs.writeFile("data.json", JSON.stringify({}, null, 2), (err) => {
            if (err) {
                console.error(err);
                return;
            }
        });
        return;
    }
});

const app = express();
var corsOptions = {
    origin: "http://localhost:4000",
};

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

let connection = mysql.createConnection({
    host: "103.179.188.159",
    port: 3306,
    user: "root",
    password: "tTv@123!",
    database: "tvbt_news",
    // multipleStatements: true, update_all
});

connection.connect((error) => {
    if (error) throw error;
    console.log("Successfully connected to the database.");
});

app.get("/data", (req, res) => {
    connection.query(`
        SELECT a.*, c.name AS category_name
        FROM article a
        LEFT JOIN category c ON a.category_id = c.id
        WHERE a.slug NOT LIKE '%tu-vi-tuoi%'
          AND a.slug NOT LIKE '%tu-vi-tron-doi%'`,
        function(err, result) {
            if (err) throw err;
            console.log(result.length);
            res.json(result);
        }
    );
});

app.get("/categories", (req, res) => {
    connection.query(`
    SELECT id, name, slug 
    FROM category
    ORDER BY name ASC`,
        function(err, result) {
            if (err) throw err;
            console.log(result.length);
            res.json(result);
        }
    );
});

app.post("/update_all", (req, res) => {
    let queries = "";
    req.body.forEach(function(item) {
        let sql = mysql.format(
            "UPDATE article SET body=?,textUpdate=? WHERE id = ? ;", [item.body, item.textUpdate, item.id]
        );
        queries += sql;
        console.log(sql);
    });
    connection.query(queries, (err, result) => {
        if (err) {
            console.log("err", err);
        } else {
            console.log("result", result);
        }
    });

    fs.writeFileSync("data.json", JSON.stringify(req.body, null, 2), (err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
    res.status(200).json({ mess: "ok" });
});

app.post("/update", (req, res) => {
    let queries = "";
    let sql = mysql.format(
        "UPDATE article SET body=?,textUpdate=? WHERE id = ? ;", [req.body.body, req.body.textUpdate, req.body.id]
    );
    queries += sql;
    connection.query(queries, (err, result) => {
        if (err) {
            console.log("err", err);
            return res.status(400).json({ mess: "error" });
        } else {
            res.status(200).json({ mess: "ok", id: req.body.id });
        }
    });
});

app.get("/article/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "Bad id" });
    }
    connection.query("SELECT * FROM `article` WHERE id = ?", [id], (err, rows) => {
        if (err) {
            console.error("SQL /article/:id error:", err);
            return res.status(500).json({ error: "Server error" });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }
        res.json(rows[0]);
    });
});

app.get("/", (req, res) => {
    res.sendFile("internal-link.html", { root: __dirname });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});