const express = require('express');
const app = express();
const mysql = require('mysql');
const cors = require('cors');
const PORT = 3001;
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your-secret-key'; // Replace with your own secret key

const bcrypt = require('bcrypt');
const saltRounds = 10;

const {encrypt, decrypt} = require('./EncryptionHandler');

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    user: 'root',
    host: 'localhost',
    password: 'passwort',
    database: 'passwortmanager'
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.log(err);
            res.status(500).send({ message: "An error occurred" });
            return;
        }

        db.query(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            [username, hash],
            (error, result) => {
                if (error) {
                    console.log(error);
                    res.status(500).send({ message: "An error occurred" });
                } else {
                    res.send("Success");
                }
            }
        );
    });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE username = ?",
        username,
        (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send({ message: "An error occurred" });
                return;
            }

            if (result.length > 0) {
                bcrypt.compare(password, result[0].password, (error, response) => {
                    if (error) {
                        console.log(error);
                        res.status(500).send({ message: "An error occurred" });
                        return;
                    }

                    if (response) {
                        const token = jwt.sign({ id: result[0].id, username: result[0].username }, SECRET_KEY);
                        res.send({ loggedIn: true, user: { username: result[0].username, id: result[0].id }, token });
                    } else {
                        res.send({ loggedIn: false, message: "Wrong username/password combination!" });
                    }
                });
            } else {
                res.send({ loggedIn: false, message: "User doesn't exist" });
            }
        }
    );
});

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.post("/addpassword", verifyToken, (req, res) => {
    const { password, title } = req.body;
    const userId = req.user.id;
    const hashedPassword = encrypt(password);
    db.query(
        "INSERT INTO passwords (password, title, iv, user_id) VALUES (?, ?, ?, ?)", 
        [hashedPassword.password, title, hashedPassword.iv, userId],
        (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.send("Success")
            }
        }
    );
});

app.get("/getpasswords", verifyToken, (req, res) => {
    const userId = req.user.id;
    db.query("SELECT * FROM passwords WHERE user_id = ?", [userId], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    })
});

app.post("/decryptpassword", (req, res) => {
    res.send(decrypt(req.body));
});

app.listen(PORT, () => {
    console.log(`Server listening on Port ${PORT}`);
});