///affichage de la carte
var mymap = L.map('mapid').setView([46.875378329598036, 2.565228180873064], 6);
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
var promise = promise0;
promise
.then(r => {
    var array = r.features
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
            polyline.onclick = function(){
                fade(polyline, 256)
            }
        }finally{

        }
        
    }
})

function fade(polyline, i){
    if(i>0){
        let color_i = '#'+componentToHex(i)+'0000';
        console.log(color_i);
        polyline.setStyle({color: color_i});
        setTimeout(fade, 100, [polyline, i-16])
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
            L.polyline(latlngs, {color: 'black'}).addTo(mymap);
        }finally{

        }
        
    }
})




function couleur_par_type(marker,type){
    var facteur=circle_radius/5.725
    if(type=="Plaque de Nivellement") {
        marker.setIcon(L.icon({iconUrl:"rn.png",iconSize: [facteur*40, facteur*40]}));
    }else if(type=="Borne Géodésique") {
        marker.setIcon(L.icon({iconUrl:"borne.png",iconSize: [facteur*29, facteur*34]}));
    }else if(type=="Clou") {
        marker.setIcon(L.icon({iconUrl:"clou.png",iconSize: [facteur*25, facteur*25]}));
    }else if(type=="Cible") {
        marker.setIcon(L.icon({iconUrl:"cible.jpg",iconSize: [facteur*25, facteur*25]}));
    }else if(type=="Orgue") {
        marker.setIcon(L.icon({iconUrl:"orgue.png",iconSize: [facteur*25, facteur*25]}));
    }else if(type=="Géomètres sauvages et autres curiosités"){
        marker.setIcon(L.icon({iconUrl:"geometre.png",iconSize: [facteur*30, facteur*30]}));
    }else if(type=="Plaque de l'esplanade des Invalides"){
        marker.setIcon(L.icon({iconUrl:"invalides.png",iconSize: [facteur*25, facteur*25]}));
    }else if(type=="Autres Curiosités"){
        marker.setIcon(L.icon({iconUrl:"ptInterro.png",iconSize: [facteur*25, facteur*25]}));
    }
}

function couleur_par_nom(nom){
    if(!( nom in liste_noms_couleurs)){
        liste_noms_couleurs[nom]=couleur_aleatoire();
    }
    return liste_noms_couleurs[nom];
}

function couleur_aleatoire() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
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

document.getElementById("localize").onclick=function(){
    mymap.locate({setView: true, maxZoom: 16});
}

function onLocationFound(e) {
    var radius = e.accuracy;

    L.marker(e.latlng).addTo(mymap)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();

    L.circle(e.latlng, radius).addTo(mymap);
}

mymap.on('locationfound', onLocationFound);

function onLocationError(e) {
    alert(e.message);
}

mymap.on('locationerror', onLocationError);

