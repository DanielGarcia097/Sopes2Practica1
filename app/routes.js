var express = require("express");

var router = express.Router();

var bodyParser = require('body-parser')

var ocioso = 0, detenido = 0, corriendo = 0, zombie = 0, suspendido = 0;

var info_pocess = new Array(), info_total = new Array(), estados_cant = [];

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
    procesos = fs.readFileSync("/proc/info_process").toString().split('\n');
    
    for (var i=3; i < procesos.length; i++) {
        info_pocess = new Array()
        var info_proceso = procesos[i].split(',');
        var pid = info_proceso[0];
        var pname = info_proceso[1];
        var pstate = info_proceso[2];

        /**
         * Cantidad de procesos según su estado:
         * S: Sleeping, I: Idlee, T: Stoped, R: Running, Z: Zombie
         * Se almacenan los contadores en un array.
         */

        if (pstate == "Stopped") {
            detenido += 1;
        } else if (pstate == "Idle") {
            ocioso += 1;
        } else if (pstate == "Suspend") {
            suspendido += 1;
        } else if (pstate == "Runnable") {
            corriendo += 1;
        } else if (pstate == "Zombie") {
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
        info_pocess.push("1");
        info_pocess.push(pstate);
        info_pocess.push(pname);


        /**
         * Lectura del porcentaje de memoria utilizada por un proceso en el archivo /statm
         

        data = fs.readFileSync(testFolder + files[file] + "/statm");
        var elems = data.toString().split(' ');
        var memoria = elems[1];
        //console.log(file + " Cantidad memoria: " + memoria + "Porcentaje: " + memoria / 10000 + "%");

        /**
         * Almacenamiento de información en arraylist:
         * id, user, state, %RAM, name
         */

        info_pocess.push(500 / 10000 + "%");
        console.log(info_pocess);
        info_total.push(info_pocess);

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
    res.render("meminfo", { uso_mem: uso_mem,total_ram:total_ram, utilizada:utilizada});
});

router.post("/MEM", function (req, res) {

    res.send({ total_ram:total_ram, utilizada:utilizada, uso_mem: uso_mem, histograma2: histograma2 });
});


/**
 * % DE MEMORIA UTILIZADA
 */
var uso_mem;
var total_ram;
var utilizada;
var histograma2 = [];

for (var i = 0; i < largo_histograma; i++) {
    histograma2[i] = [i, 0];
}

setInterval(function () {
    var data = fs.readFileSync("/proc/info_memoria");
    var total_ram = data.toString().split('\n')[4];
    var libre = data.toString().split('\n')[6];

    utilizada = total_ram - libre;
    uso_mem = utilizada*100/total_ram;

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
