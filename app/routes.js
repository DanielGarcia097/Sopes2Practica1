var express = require("express");

var router = express.Router();

var bodyParser = require('body-parser')

var ocioso = 0, detenido = 0, corriendo = 0, zombie = 0, suspendido = 0;

var info_pocess, info_total = new Array(), estados_cant = [];

var userid = require('userid');

const fs = require('fs');

const testFolder = '/proc/';

const os = require('os');

var terminate = require('terminate');

var memStat = require('mem-stat');

/**
 * CODIGO GET
 */

router.get("/dashboard", function (req, res) {
    res.render("dashboard", { data1: estados_cant, data2: info_total });
});

/**
 * CODIGO POST
 * Información de los procesos son enviados mediante el render.
 */
router.post("/dashboard", function (req, res) {

    // res.send("Hola Mundo.");
    console.log(req.body.email);
    if (req.body.email == "admin@admin.com" && req.body.password == 123) {
        getProcessData();
        res.render("dashboard", { data1: estados_cant, data2: info_total });
    } else {
        res.render("index");
    }
});

router.post("/inicio", function (req, res) {

    // res.send("Hola Mundo.");
    console.log("EL PID ES........................................." + req.body.processid);
    killPocess(req.body.processid);
    res.render("dashboard", { data1: estados_cant, data2: info_total });
});

/**
 * DETENER PROCESO:
 */


killPocess = function (pid) {
    terminate(pid, function (err) {
        if (err) { // you will get an error if you did not supply a valid process.pid
            console.log("Oopsy: " + err); // handle errors in your preferred way.
        }
        else {
            console.log('done SE TERMINO EL PROCESO.'); // terminating the Processes succeeded.
        }
    });
}



/**
 * SE OBTIENE LA INFORMAICÓN DE LOS PROCESOS:
 * Se hace la lectura de archivos de forma sincrona para obtener información
 * de procesos.
 */

let files;
getProcessData = function () {
    files = fs.readdirSync(testFolder);
    for (var file in files) {
        if (!isNaN(files[file])) {
            var pid = files[file];
            dir_file = testFolder + files[file];
            var data = fs.readFileSync(dir_file + "/status");
            info_pocess = new Array();
            /**
             * Información extraída del archivo /status
             * 2: Contiene el estado del proceso
             * 8: Contiene el id del usuario que inicio el proceso
             * 0: Contiene el nombre del proceso.
             * */
            var elems = data.toString().split('\n');
            var estado = elems[2];
            var user = elems[8];
            var state = estado.split('	')[1].split(' ');
            var id_user = user.split('	');
            var name = elems[0].split('	');
            //console.log("uid name is:", userid.username(parseInt(id_user[1])));
            //console.log(id_user[1]);
            //console.log("name process: " + name[1]);
            //console.log("PID: " + pid);

            /**
             * Cantidad de procesos según su estado:
             * S: Sleeping, I: Idlee, T: Stoped, R: Running, Z: Zombie
             * Se almacenan los contadores en un array.
             */

            if (state[0] == "S") {
                suspendido += 1;
            } else if (state[0] == "I") {
                ocioso += 1;
            } else if (state[0] == "T") {
                detenido += 1;
            } else if (state[0] == "R") {
                corriendo += 1;
            } else if (state[0] == "Z") {
                zombie += 1;
            }

            //console.log("REPORTE");
            //console.log("Suspendidos: " + suspendido);
            //console.log("Ociosos: " + ocioso);
            //console.log("Detenido: " + detenido);
            //console.log("Corriendo: " + corriendo);

            estados_cant[0] = suspendido;
            estados_cant[1] = ocioso;
            estados_cant[2] = detenido;
            estados_cant[3] = corriendo;
            estados_cant[4] = zombie;

            info_pocess.push(pid);
            info_pocess.push(userid.username(parseInt(id_user[1])));
            info_pocess.push(state[0]);
            info_pocess.push(name[1]);


            /**
             * Lectura del porcentaje de memoria utilizada por un proceso en el archivo /statm
             */

            data = fs.readFileSync(testFolder + files[file] + "/statm");
            var elems = data.toString().split(' ');
            var memoria = elems[1];
            //console.log(file + " Cantidad memoria: " + memoria + "Porcentaje: " + memoria / 10000 + "%");

            /**
             * Almacenamiento de información en arraylist:
             * id, user, state, %RAM, name
             */

            info_pocess.push(memoria / 10000 + "%");
            info_total.push(info_pocess);
        }
    }
}

var uso_cpu;
var cpuStats = require('cpu-stats');
var histograma = [];
var largo_histograma = 61;

for (var i = 0; i < largo_histograma; i++) {
    histograma[i] = [i, 0];
}

setInterval(function () {
    cpuStats(1000, function (error, result) {
        if (error) return console.error('Oh noes!', error) // actually this will never happen
        //console.log(result);
        //console.log("%CPU: " + result[0].cpu);
        //console.log("%Idle: " + result[0].idle);
        uso_cpu = result[0].cpu;
        updateHistograma(Math.round(uso_cpu));
    });
}, 1000);

function updateHistograma(uso_actual) {
    if (histograma.length >= largo_histograma)
        histograma.shift();

    histograma.push([0, uso_actual]);

    for (var i = 0; i < largo_histograma; i++)
        histograma[i][0] = i;
}


/**
 * PETICIÓN GET PARA LA VISTA DE INFORMACIÓN CPU
 */

router.get("/CPU", function (req, res) {

    res.render("cpuinfo", { uso_cpu: uso_cpu });
});

router.post("/CPU", function (req, res) {

    res.send({ uso_cpu: uso_cpu, histograma: histograma });
});


/**
 * PETICIÓN GET PARA LA VISTA DE INFORMACIÓN MEMORIA
 */

router.get("/MEM", function (req, res) {

    res.render("meminfo", { uso_mem: uso_mem });
});

router.post("/MEM", function (req, res) {

    res.send({ uso_mem: uso_mem, histograma2: histograma2 });
});


/**
 * % DE MEMORIA UTILIZADA
 */
var uso_mem;
var histograma2 = [];

for (var i = 0; i < largo_histograma; i++) {
    histograma2[i] = [i, 0];
}

setInterval(function () {
    uso_mem = memStat.usedPercent();
    updateHistograma2(Math.round(uso_mem));
}, 1000);


function updateHistograma2(uso_actual) {
    if (histograma2.length >= largo_histograma)
        histograma2.shift();

    histograma2.push([0, uso_actual]);

    for (var i = 0; i < largo_histograma; i++)
        histograma2[i][0] = i;
}



router.use(bodyParser.json())

module.exports = router;
