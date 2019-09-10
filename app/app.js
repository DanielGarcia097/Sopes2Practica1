/**
 * Express es un framework minimalista de NodeJs que contiene funcionalidades
 * integradas.
 * 
 * require:peticiones
 * res: respuestas.
 */
var routers = require("./routes.js");

var express = require("express");

var app = express();

const path = require('path');

var bodyParser = require('body-parser')

app.set("view engine", "jade"); //definicion del motor de vistas

app.get("/login", function (req, res) {

  // res.send("Hola Mundo.");
  res.render("index");
});

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use("/", routers);

app.listen(8000);
