import express from "express"
import mysql from "mysql2"
import cors from "cors"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import { profileUpload } from "./profile_upload.js"
import { uploadPetsImages } from "./pet_upload.js"
import ElasticEmail from "@elasticemail/elasticemail-client"


dotenv.config({path: "./.env"})

const app = express()

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/images", express.static("image"));
app.use(cors());
app.use(bodyParser.json());


const db = mysql.createConnection({
    host: process.env.db_host, 
    user: process.env.db_user,
    password: process.env.db_pass,
    database: process.env.db_name
})

db.connect(error => {
    if (error) {
        console.log(error);
    }
    else {
        console.log("Connected");
    }
})

const getAllPets = (res) => {
    db.query("SELECT * FROM pets", (err, result) => {
        if (err) console.log(err)
        else {
            res.send({
                pets: result
            })
        }
    })
}

app.post("/register", (req, res) => {

    profileUpload(req, res, (errr) => {
        if (errr) console.log(errr)   
        else {
            const {fname, lname, email, pass, passRepeat} = req.body
            const img = req.file ? req.file.filename : "avatar.png"
        
            db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
                if (err) {
                    res.send({
                        message: err
                    })
                }
                else if (result.length > 0) {
                    res.send({
                        message: "This email is already in use"
                    })
                }
                else if (pass != passRepeat) {
                    res.send({
                        message: "Passwords do not match"
                    })
                }
                else {
                    db.query("INSERT INTO users SET ?", {f_name: fname, l_name: lname, email, password: pass, profile_img: img, isAdmin: false}, (error, results) => {
                        if (error) {
                            res.send({
                                message: err
                            })
                        }
                        else {
                            res.send({
                                message: "Account succesfully registered"
                            })
                        }
                    })
                }
            })
        }
    })
})

app.post("/login", (req, res) => {
    const {email, pass} = req.body

    db.query("SELECT * FROM users WHERE email = ? and password = ?", [email, pass], (err, result) => {
        if (err) {
            res.send({
                message: err
            })
        }
        else if (result.length == 0) {
            res.send({
                message: "Incorrect email or password"
            })
        }
        else {
            res.json({user: result[0]})
        }
    })
})

app.post("/addPet", (req, res) => {
    uploadPetsImages(req, res, (err) => {
        if (err) console.log(err)
        else {
            const {name, type, breed, desc, origin, min, max} = req.body
            db.query("INSERT INTO pets SET ?", {name, type, breed, desc, origin, min, max, 
                img1: req.files[0]?.filename || "",
                img2: req.files[1]?.filename || "", 
                img3: req.files[2]?.filename || "", 
                img4: req.files[3]?.filename || "", 
                img5: req.files[4]?.filename || "", 
            }, (error, result) => {
                if (error) console.log(error)
                else {
                    res.send({
                        message: "Pet added"
                    })
                }
            })
        }
        
    })
})

app.post("/updatePet", (req, res) => {
    uploadPetsImages(req, res, (err) => {
        if (err) console.log(err)
        else {
            const {id, name, type, breed, desc, origin, min, max} = req.body
            db.query("UPDATE pets SET ? WHERE id = ?", [{name, type, breed, desc, origin, min, max,
                img1: req.files[0]?.filename || "",
                img2: req.files[1]?.filename || "",
                img3: req.files[2]?.filename || "",
                img4: req.files[3]?.filename || "",
                img5: req.files[4]?.filename || "",
            }, id], (error, result) => {
                if (error) console.log(error)
                else res.send({
                    message: "Pet updated"
                })
            })
        }
    })
})

app.post("/deletePet", (req, res) => {
    db.query("DELETE FROM pets WHERE id = ?", [req.body.id], (err, result) => {
        if (err) console.log(err)
        else {
            getAllPets(res)
        }   
    })
})

app.post("/allPets", (req, res) => {
    getAllPets(res)
})

app.post("/singlePet", (req, res) => {
    db.query("SELECT * FROM pets WHERE id = ?", [req.body.id], (err, result) => {
        if (err) console.log(err)
        else {
            res.send({
                pet: result[0]
            })
        }
    })
})

app.post("/sendEmail", (req, res) => {
    const {email, message} = req.body
    let defaultClient = ElasticEmail.ApiClient.instance;
 
    let apikey = defaultClient.authentications['apikey'];
    apikey.apiKey = process.env.api_key

    const api = new ElasticEmail.EmailsApi();

    const emailToSend = ElasticEmail.EmailMessageData.constructFromObject({
        Recipients: [
          new ElasticEmail.EmailRecipient(process.env.email)
        ],
        Content: {
          Body: [
            ElasticEmail.BodyPart.constructFromObject({
              ContentType: "HTML",
              Content: `An user with email: ${email} just sent this message: ${message}`
            })
          ],
          Subject: "Incoming email",
          From: process.env.email
        }
      });
       
      var callback = function(error, data, response) {
        if (error) {
          console.error(error);
        } else {
          res.send({
            message: "Email sent succesfully"
          })
        }
      };
      api.emailsPost(emailToSend, callback);
})

app.get('/message', (req, res) => {
    res.json({ message: "Hello from server!" });
});

app.listen(5000, () => {
    console.log(`Server is running on port 5000.`);
});