
/// --- CONFIGURATION DES FONDS DE CARTE ---

// 1. Définition des différents fonds de carte (Base Layers)
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 22,
    maxNativeZoom: 19
});

var planIgnLayer = L.tileLayer('https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
    attribution: '&copy; <a href="https://www.ign.fr/" target="_blank">IGN</a>',
    maxZoom: 22,
    maxNativeZoom: 19
});

var orthoIgnLayer = L.tileLayer('https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
    attribution: '&copy; <a href="https://www.ign.fr/" target="_blank">IGN</a>',
    maxZoom: 22,
    maxNativeZoom: 19
});

// 2. Initialisation de la carte avec le Plan IGN par défaut
var mymap = L.map('mapid', {
    center: [46.875378329598036, 2.565228180873064],
    zoom: 6,
    layers: [osmLayer] // Définit le fond de plan au démarrage (vous pouvez mettre osmLayer si préféré)
});


// 3. Création de l'objet regroupant les fonds disponibles pour le menu
var baseMaps = {
    "Plan IGN": planIgnLayer,
    "Photos Aériennes (IGN)": orthoIgnLayer,
    "OpenStreetMap": osmLayer
};

// (Conservez vos FeatureGroups existants juste en dessous)
var LayersMarker = new L.FeatureGroup().addTo(mymap);


layer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 22, maxNativeZoom :19,
}).addTo(mymap);


var LayersMarker = new L.FeatureGroup().addTo(mymap);

var liste_noms_couleurs={};

var json_balades={};

var promise0 = new Promise((resolve, reject) => {
    fetch("balades.geojson")
    .then(r => r.json())
    .then(r => {
        json_balades = r;
        promise = new Promise((resolve, reject) => {
            resolve(json_balades);
        });
        resolve(r);
    })
});
var target;
var promise = promise0;
promise
.then(r => {
    array = r.features
    for(var i=0; i<array.length;i++){
        var obj = array[i];
        console.log(obj);
        lnglats = obj.geometry.coordinates;
        latlngs = lnglats[0].map(x => [x[1],x[0]])
        try{
            var polyline = L.polyline(latlngs, {color: 'black'}).addTo(mymap);
            polyline.bindPopup(`
            <H3>${obj.properties.nom}</H3>
            <p>${obj.properties.Date}</p>
            <p>${obj.properties.Longueur}</p>
            `)
            polyline.addEventListener("click", function(e){
                target = e.target;
                fade(target, 256);
                target.openPopup();
            })
        }finally{

        }
        
    }
})

function fade(polyline, i){
    if(i>0){
        let color_i = '#'+componentToHex(i)+'0000';
        console.log(color_i);
        polyline.setStyle({color: color_i});
        setTimeout(x=>{fade(polyline, i-16)}, 100)
    }
}

var promise1 = new Promise((resolve, reject) => {
    fetch("rues_prises.geojson")
    .then(r => r.json())
    .then(r => {
        json_balades = r;
        promise2 = new Promise((resolve, reject) => {
            resolve(json_balades);
        });
        resolve(r);
    })
});
var promise2 = promise1;
promise2
.then(r => {
    var array = r.features
    for(var i=0; i<array.length;i++){
        var obj = array[i];
        console.log(obj);
        lnglats = obj.geometry.coordinates;
        latlngs = lnglats.map(x => [x[1],x[0]])
        try{
            var polyline = L.polyline(latlngs, {color: 'black'}).addTo(mymap);
            polyline.addEventListener("click", function(e){
                target = e.target;
                fade(target, 256);
            })
        }finally{

        }
        
    }
})


document.getElementById("localize").onclick=function(){
    mymap.locate({setView: true, maxZoom: 16});
}
document.getElementById("lyon").onclick=function(){
    mymap.setView([45.7578137, 4.8320114], 11);
}
document.getElementById("paris").onclick=function(){
    mymap.setView([48.8534951, 2.3483915], 12);
}

/*

//Récupération des objets sur le serveur
var requestURL = 'balades.geojson';
var request = new XMLHttpRequest();
request.open('GET', requestURL);
request.responseType = 'json';
request.send();
request.onload = function() {
    balades = request.response;
    GeoJsonLayer.addData(balades);
}*/

// Géocodage inverse

var inputVille = document.getElementById('inputAdresse')
inputVille.addEventListener('focusout', function(event) {
    chercher();  
});

inputVille.addEventListener('keydown', (e) => {
    if (e.keyCode==13){
        chercher();
    }
});

document.getElementById("btn-recherche").onclick=chercher();


function chercher(){
    var adresse = $("#inputAdresse").val();
    console.log(adresse)
    if(adresse != ""){
        $.ajax({
            url: "https://nominatim.openstreetmap.org/search", // URL de Nominatim
            type: 'get', // Requête de type GET
            data: "q="+adresse+"&format=json&addressdetails=1&limit=1&polygon_svg=1" 
            // Données envoyées (q -> adresse complète, format -> format attendu pour la réponse, limit -> nombre de réponses attendu, polygon_svg -> fournit les données de polygone de la réponse en svg)
        }).done(function (response) {
            if(response != ""){
                console.log(response)
                Lat = response[0]['lat'];
                Lng = response[0]['lon'];
                bbox1 = parseFloat(response[0]['boundingbox'][0]);
                bbox2 = parseFloat(response[0]['boundingbox'][1]);
                x = (Math.abs(bbox1 - bbox2));
                zoom_level1 = parseInt(-75*x+19.5)//parseInt(c - a*(x/a)**(1/b));
                zoom_level2 = parseInt(-2.1053*x+12.2105)//parseInt(n - l*(x/l)**(1/m));
                zoom_level3 = parseInt(-0.0306*x+8.0612)
                zoom_level = Math.max(zoom_level1, zoom_level2, zoom_level3, 0);
                console.log(zoom_level)
                mymap.flyTo([Lat,Lng], zoom_level); 
            }                
        }).fail(function (error) {
            alert(error);
            console.log("fail")
        });      
    }
}

function Reverse_chercher(lat,lon,reponse){
    $.ajax({
        url: "https://nominatim.openstreetmap.org/reverse", // URL de Nominatim
        type: 'get', // Requête de type GET
        data: "lat="+lat+"&lon="+lon+"&format=json&zoom=12&addressdetails=1" // Données envoyées (lat, lon -> positions, format -> format attendu pour la réponse, zoom -> niveau de détail)
    }).done(function (response) {
        if(response != ""){
            console.log(response)
            reponse=response
        }                
    }).fail(function (error) {
        console.log(error);
        console.log("fail")
    });      
}

document.getElementById("Quitter").addEventListener("click",e=>{
    window.location.href="..";
});

function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
function hexToRgb(hex){
    var r=parseInt(hex.slice(1,3),16);
    var g=parseInt(hex.slice(3,5),16);
    var b=parseInt(hex.slice(5,7),16);
    return [r,g,b]
}
function couleur_par_score(pts){
    return rgbToHex(Math.floor(255-2.55*pts),Math.floor(2.55*pts),0);
}


function onLocationFound(e) {
    var radius = e.accuracy;
    console.log(e)

    L.marker(e.latlng).addTo(mymap)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();

    L.circle(e.latlng, radius).addTo(mymap);
}

mymap.on('locationfound', onLocationFound);

function onLocationError(e) {
    alert(e.message);
}

mymap.on('locationerror', onLocationError);

// 1. Initialisation d'une couche GeoJSON Leaflet vide pour les GR
// On lui applique une couleur rouge unie, typique des sentiers de Grande Randonnée
var grLayer = L.geoJSON(null, {
    style: {
        color: '#e60000',
        weight: 3,
        opacity: 0.85
    }
});

// 2. Chargement asynchrone du fichier grs-de-france.geojson
fetch("grs-de-france.geojson")
    .then(response => {
        if (!response.ok) {
            throw new Error("Impossible de récupérer le fichier grs-de-france.geojson");
        }
        return response.json();
    })
    .then(data => {
        // Injection des données géographiques dans notre couche
        grLayer.addData(data);
        
        // Vérification de sécurité au cas où l'utilisateur clique avant la fin du chargement
        if (document.getElementById("switch-gr").checked) {
            grLayer.addTo(mymap);
        }
    })
    .catch(error => {
        console.error("Erreur lors du chargement des GR :", error);
    });



// Déclarez d'abord grLayer plus haut dans votre script, puis ajoutez-le aux "Overlays" du contrôle :
var overlayMaps = {
    "Sentiers GR": grLayer
};

// Ajout du contrôle avec BaseMaps (boutons radio) ET OverlayMaps (cases à cocher)
L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(mymap);
