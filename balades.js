
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


var liste_noms_couleurs={};

// --- CONFIGURATION ET FILTRAGE DES BALADES ---
var json_balades = {}
var donneesBaladesGlobales = null;

// 1. Initialisation de la couche GeoJSON des balades avec son style par défaut
var baladesLayer = L.geoJSON(null, {
    style: {
        color: 'black',
        weight: 3
    },
    onEachFeature: function(feature, layer) {
        // Ajout du popup
        layer.bindPopup(`
            <h3>${feature.properties.nom || 'Sans nom'}</h3>
            <p><strong>Date :</strong> ${feature.properties.Date || 'Inconnue'}</p>
            <p><strong>Longueur :</strong> ${feature.properties.Longueur || 'Inconnue'}</p>
        `);
        
        // Gestion de l'effet de fondu au clic
        layer.on("click", function(e) {
            var target = e.target;
            fade(target, 256);
            target.openPopup();
        });
    }
}).addTo(mymap); // On l'ajoute directement à la carte au démarrage

// 2. Fonction principale de filtrage des balades
function appliquerFiltreBalades() {
    if (!donneesBaladesGlobales) return;

    // Récupération des valeurs des inputs
    var rechercheNom = document.getElementById('filtreBaladeNom').value.trim().toLowerCase();
    
    var longOp = document.getElementById('filtreBaladeLongOp').value;
    var longVal = parseFloat(document.getElementById('filtreBaladeLongVal').value);
    
    var dateOp = document.getElementById('filtreBaladeDateOp').value;
    var dateValHTML = document.getElementById('filtreBaladeDateVal').value; // Format AAAA-MM-JJ
    var dateSeuil = dateValHTML ? new Date(dateValHTML) : null;

    // On vide la couche actuelle
    baladesLayer.clearLayers();

    // Application du filtre multicritère
    baladesLayer.options.filter = function(feature) {
        var props = feature.properties || {};

        // A. FILTRE PAR NOM
        if (rechercheNom) {
            var nom = props.nom ? props.nom.toLowerCase() : "";
            if (!nom.includes(rechercheNom)) return false;
        }

        // B. FILTRE PAR LONGUEUR
        // Extraction du nombre depuis la chaîne (ex: "12.5 km" ou "7km" -> 12.5 ou 7)
        if (longOp !== 'tous' && !isNaN(longVal)) {
            var longueurStr = props.Longueur ? props.Longueur.toString() : "";
            var longueurNum = parseFloat(longueurStr.replace(/[^\d.]/g, ''));
            
            if (!isNaN(longueurNum)) {
                if (longOp === 'inf' && longueurNum >= longVal) return false;
                if (longOp === 'sup' && longueurNum <= longVal) return false;
            } else {
                return false; // Si la balade n'a pas de longueur valide, on la masque
            }
        }

        // C. FILTRE PAR DATE
        if (dateOp !== 'tous' && dateSeuil) {
            var dateStr = props.Date ? props.Date.toString() : ""; 
            // Tente de parser la date du GeoJSON (gère les formats standards comme "2023-10-25" ou "10/25/2023")
            // Note : Si vos dates sont au format français "JJ/MM/AAAA", il faudra un petit helper pour inverser.
            var baladeDate = new Date(dateStr);

            if (!isNaN(baladeDate.getTime())) {
                if (dateOp === 'avant' && baladeDate >= dateSeuil) return false;
                if (dateOp === 'apres' && baladeDate <= dateSeuil) return false;
            } else {
                return false; // Si date invalide ou manquante
            }
        }

        return true; // La balade valide tous les critères
    };

    // On réinjecte les données filtrées
    baladesLayer.addData(donneesBaladesGlobales);
}

// 3. Écouteurs d'événements pour filtrer en temps réel
document.getElementById('filtreBaladeNom').addEventListener('keyup', appliquerFiltreBalades);
document.getElementById('filtreBaladeLongOp').addEventListener('change', appliquerFiltreBalades);
document.getElementById('filtreBaladeLongVal').addEventListener('input', appliquerFiltreBalades);
document.getElementById('filtreBaladeDateOp').addEventListener('change', appliquerFiltreBalades);
document.getElementById('filtreBaladeDateVal').addEventListener('change', appliquerFiltreBalades);

// Bouton de réinitialisation complet
document.getElementById('btn-reset-balades').onclick = function() {
    document.getElementById('filtreBaladeNom').value = "";
    document.getElementById('filtreBaladeLongOp').value = "tous";
    document.getElementById('filtreBaladeLongVal').value = "";
    document.getElementById('filtreBaladeDateOp').value = "tous";
    document.getElementById('filtreBaladeDateVal').value = "";
    appliquerFiltreBalades();
};

// 4. Chargement asynchrone des balades
fetch("balades.geojson")
    .then(r => {
        if (!r.ok) throw new Error("Erreur de chargement de balades.geojson");
        return r.json();
    })
    .then(data => {
        json_balades = data; // Conserve votre ancienne variable globale au cas où
        donneesBaladesGlobales = data; // Stockage pour notre filtre
        
        // Affichage initial
        baladesLayer.addData(data);
    })
    .catch(err => console.error("Erreur balades:", err));

function fade(polyline, i) {
    if (i > 0) {
        let color_i = '#' + componentToHex(i) + '0000';
        polyline.setStyle({ color: color_i });
        setTimeout(x => { fade(polyline, i - 16) }, 100);
    }
}

// --- CHARGEMENT DES RUES PRISES ---
fetch("rues_prises.geojson")
    .then(r => r.json())
    .then(data => {
        var array = data.features;
        for (var i = 0; i < array.length; i++) {
            var obj = array[i];
            var lnglats = obj.geometry.coordinates;
            var latlngs = lnglats.map(x => [x[1], x[0]]);
            
            var polyline = L.polyline(latlngs, { color: 'black' }).addTo(mymap);
            polyline.addEventListener("click", function(e) {
                target = e.target;
                fade(target, 256);
            });
        }
    })
    .catch(err => console.error("Erreur rues prises:", err));


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

document.getElementById("btn-recherche").onclick=chercher;


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

// --- CONFIGURATION ET FILTRAGE DES GR ---

// 1. Création du volet d'affichage dédié aux GR
mymap.createPane('grPane');
mymap.getPane('grPane').style.zIndex = 350;

// --- CONFIGURATION ET FILTRAGE DES GR ---

// 1. Création du volet d'affichage dédié aux GR
mymap.createPane('grPane');
mymap.getPane('grPane').style.zIndex = 350;

var donneesGRGlobales = null;

// 2. Initialisation de la couche GeoJSON vide
var grLayer = L.geoJSON(null, {
    pane: 'grPane',
    style: {
        color: '#e60000',
        weight: 3,
        opacity: 0.85
    },
    onEachFeature: function(feature, layer) {
        if (feature.properties && feature.properties.name) {
            layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
        }
    }
});

// 3. Fonction de filtrage robuste (gère "2", "GR2", "GR 2")
function appliquerFiltreGR() {
    if (!donneesGRGlobales) return;

    var recherche = document.getElementById('inputFiltreGR').value.trim().toLowerCase();
    grLayer.clearLayers();

    grLayer.options.filter = function(feature) {
        if (!recherche) return true;

        var nomGR = (feature.properties && feature.properties.name) ? feature.properties.name.toLowerCase() : "";
        var refGR = (feature.properties && feature.properties.ref) ? feature.properties.ref.toLowerCase() : "";

        // On extrait le numéro pur (ex: "2" depuis "2", "gr2" ou "gr 2")
        var numeroRecherche = recherche.replace(/[^\d]/g, '');

        if (numeroRecherche !== '') {
            // Cette regex vérifie que le numéro trouvé est bien isolé des autres chiffres
            // Elle valide "gr 2", "gr2", "2" mais rejette "gr 21", "21", "gr22"
            var regexStrict = new RegExp('(?<!\\d)' + numeroRecherche + '(?!\\d)');
            
            // Si l'utilisateur a écrit "gr", on vérifie aussi la présence de "gr"
            if (recherche.includes('gr')) {
                return (nomGR.includes('gr') && regexStrict.test(nomGR)) || 
                       (refGR.includes('gr') && regexStrict.test(refGR));
            }
            return regexStrict.test(nomGR) || regexStrict.test(refGR);
        } else {
            // Recherche textuelle classique si aucun chiffre n'est saisi (ex: "bretagne")
            return nomGR.includes(recherche) || refGR.includes(recherche);
        }
    };

    grLayer.addData(donneesGRGlobales);
}

// 4. Chargement initial du GeoJSON
fetch("grs-de-france.geojson")
    .then(response => {
        if (!response.ok) throw new Error("Impossible de récupérer le fichier grs-de-france.geojson");
        return response.json();
    })
    .then(data => {
        donneesGRGlobales = data;
        grLayer.addData(data);
    })
    .catch(error => console.error("Erreur lors du chargement des GR :", error));


// --- GESTION DU MENU LEAFLET ET INJECTION DU FILTRE ---

var overlayMaps = {
    "Sentiers GR": grLayer
};

// Création du contrôle
var menuCouches = L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(mymap);

// Injection au bon endroit dans le DOM de Leaflet
(function integrerFiltreDansMenu() {
    var conteneurMenu = menuCouches.getContainer();
    
    // CORRECTION : On cible la liste interne pour que le filtre s'efface/s'affiche en même temps que le menu
    var listeInterne = conteneurMenu.querySelector('.leaflet-control-layers-list');
    
    if (listeInterne) {
        var filtreContainer = L.DomUtil.create('div', 'leaflet-control-layers-filter', listeInterne);
        filtreContainer.style.marginTop = '10px';
        filtreContainer.style.borderTop = '1px solid #ccc';
        filtreContainer.style.paddingTop = '8px';
        
        var inputHTML = document.createElement('input');
        inputHTML.type = 'text';
        inputHTML.id = 'inputFiltreGR';
        inputHTML.placeholder = 'Filtrer les GR...';
        inputHTML.style.width = '100%';
        inputHTML.style.boxSizing = 'border-box';
        inputHTML.style.padding = '4px';
        inputHTML.style.fontSize = '12px';
        
        filtreContainer.appendChild(inputHTML);
        
        inputHTML.addEventListener('keyup', appliquerFiltreGR);
        
        L.DomEvent.disableClickPropagation(inputHTML);
        L.DomEvent.disableScrollPropagation(inputHTML);
    }
})();

