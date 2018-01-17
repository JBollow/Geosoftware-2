coperniCloud.controller('mainController', ['$scope', '$timeout', 'leafletData', '$uibModal', '$http', function ($scope, $timeout, leafletData, $uibModal) {

    $scope.searchedItem = "";
    $scope.checked = false;
    $scope.input = {};
    $scope.requestsCounter = 0; //to avoid sending the request multiple times
    $scope.thereIsAnOverlay = false;
    $scope.overlayName = "";
    $scope.opacityValue = 100;
    $scope.overlayVisible = true;

    var dataType = "";
    var tilesServer = "tiles";
    var bandType = "TCI";
    var serverUrl = "http://gis-bigdata:12015/";

    //the map
    angular.extend($scope, {
        center: {
            lat: 51.82956,
            lng: 7.276709,
            zoom: 5
        },
        markers: $scope.markers,
        defaults: {
            tileLayer: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
            zoomControlPosition: 'bottomright',
            tileLayerOptions: {
                opacity: 0.9,
                detectRetina: true,
                reuseTiles: true,
            },
            scrollWheelZoom: true
        },
        layers: {
            baselayers: {
                Esri_WorldTopoMap: {
                    name: 'Esri WorldTopoMap',
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
                    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
                    type: 'xyz',
                    layerOptions: {
                        minZoom: 3,
                        maxZoom: 13,
                        // apikey: ,
                        // mapid: ''
                    }
                },
                DarkMatter: {
                    name: 'DarkMatter',
                    url: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                    type: 'xyz',
                    layerOptions: {
                        minZoom: 3,
                        maxZoom: 13,
                        // apikey: ,
                        // mapid: ''
                    }
                },
                Grayscale: {
                    name: 'Grayscale',
                    url: 'http://korona.geog.uni-heidelberg.de/tiles/roadsg/x={x}&y={y}&z={z}',
                    type: 'xyz',
                    layerOptions: {
                        minZoom: 3,
                        maxZoom: 13,
                        // apikey: ,
                        // mapid: ''
                    }
                },
                OpenStreetMap_DE: {
                    name: 'OSMDE',
                    url: 'http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
                    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    type: 'xyz',
                    layerOptions: {
                        minZoom: 3,
                        maxZoom: 13,
                        // apikey: ,
                        // mapid: ''
                    }
                },
                OpenStreetMap_HOT: {
                    name: 'OpenStreetMap Hot',
                    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
                    type: 'xyz',
                    layerOptions: {
                        minZoom: 3,
                        maxZoom: 13,
                        // apikey: ,
                        // mapid: ''
                    }
                }
            },
        }
    });

    // A global reference is set.
    leafletData.getMap('map').then(function (m) {
        $scope.baseMap = m;
        //preventing from going outside the bounds of one world :D
        var southWest = L.latLng(-89.98155760646617, -180),
            northEast = L.latLng(89.99346179538875, 180);
        var bounds = L.latLngBounds(southWest, northEast);
        $scope.baseMap.setMaxBounds(bounds);
        $scope.baseMap.on('drag', function () {
            $scope.baseMap.panInsideBounds(bounds, {
                animate: false
            });
        });
    });

    /**
     * Watches for the global variable 'searchedItem'
     */
    $scope.$watch('searchedItem', function () {
        if ($scope.searchedItem !== "") {
            let input = {
                name: $scope.searchedItem
            };
            $scope.startSearch(input);
        }
    });

    /**
     * Sending the search form if enter is clicked
     * @param {*}  event
     */
    $scope.triggerEnter = function ($event) {
        if (event.keyCode == 13) { // '13' is the key code for enter
            // $scope.startSearch(input);
            $timeout(function () {
                document.querySelector('#searchButton').click();
            }, 0);
        }
    };

    /**
     * Function that searches for values in the passed object
     */
    $scope.startSearch = function (input) {
        var parsedBefore, parsedAfter, name;
        //Sending zeroes when an imput is empty to make checking in backend easier
        if (input.before !== undefined && input.before !== null) {
            parsedBefore = Date.parse(input.before);
        } else {
            parsedBefore = '0';
        }

        if (input.after !== undefined && input.after !== null) {
            parsedAfter = Date.parse(input.after);
        } else {
            parsedAfter = '0';
        }

        if (input.name !== undefined && input.name !== null) {
            name = input.name.toUpperCase();
        } else {
            name = '0';
        }

        $.ajax({
            url: 'http://localhost:10002/search',
            type: 'get',
            data: {
                name: name,
                before: parsedBefore,
                after: parsedAfter
            },
            success: function (data) {
                if (data.length !== 0) {
                    $scope.showResults(data);
                } else {
                    swal({
                        titel: 'Error',
                        text: "No results!",
                        type: 'error',
                        customClass: 'swalCc',
                        buttonsStyling: false,
                    });
                }

            },
            error: function (message) {
                swal({
                    titel: 'Error',
                    text: message,
                    type: 'error',
                    customClass: 'swalCc',
                    buttonsStyling: false,
                });
            }
        });
        $scope.searchedItem = '';
    };

    /**
     * A pop-up for the results of the search
     * @param results
     */
    $scope.showResults = function (results) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '../templates/popups/search-results.html',
            controller: 'resultsController',
            size: 'lg',
            resolve: {
                data: function () {
                    return results;
                }
            }
        });

        //for when the modal is closed
        modalInstance.result.then(function (meta) {
            $scope.selected = meta.result;
            let bounds = meta.bounds;
            console.log($scope.selected.name);
            //here open a window for image editing
            $scope.addLayer($scope.selected.name, bounds);
        });
    };

    $scope.addTileServer = function (tilesServer, folderName, dataType, bandType) {
        $scope.tilesLayer = L.tileLayer(serverUrl + tilesServer + '/' + folderName + '.SAFE/' + dataType + bandType + '/{z}/{x}/{y}.png', {
            attribution: 'Tiles',
            tms: true,
            minZoom: 3,
            maxZoom: 13
        }).addTo($scope.baseMap);
    };

    $scope.addLayer = function (folderName, bounds) {
        $scope.thereIsAnOverlay = false;

        if ($scope.tilesLayer) {
            $scope.baseMap.removeLayer($scope.tilesLayer);
        }

        // Different tile path for 1C and 2A        
        if (folderName.includes("MSIL1C")) {
            dataType = "";
        }
        if (folderName.includes("MSIL2A")) {
            dataType = "R10m/";
        }

        $scope.addTileServer(tilesServer, folderName, dataType, bandType);

        $scope.baseMap.fitBounds(bounds, {
            padding: [150, 150]
        });
        $scope.overlayName = folderName;
        $scope.thereIsAnOverlay = true;
    };

    $scope.changeBand = function () {
        $scope.thereIsAnOverlay = false;

        if ($scope.tilesLayer) {
            $scope.baseMap.removeLayer($scope.tilesLayer);
        }

        bandType = band.value;
        folderName = $scope.selected.name;

        // Different tile path for 1C and 2A        
        if (folderName.includes("MSIL1C")) {
            dataType = "";
        }
        if (folderName.includes("MSIL2A")) {
            dataType = "R10m/";
        }

        $scope.addTileServer(tilesServer, folderName, dataType, bandType);

        $scope.overlayName = folderName;
        $scope.thereIsAnOverlay = true;

    };

    /**
     * Enables drawing a rectangle and starts a search when finished
     */
    $scope.createBoundingBox = function () {
        $scope.requestsCounter = 0;
        var polygonDrawer = new L.Draw.Rectangle($scope.baseMap);
        polygonDrawer.enable();

        $scope.baseMap.on('draw:created', function (e) {
            var type = e.layerType,
                layer = e.layer;
            boundingbox = e.layer._latlngs;
            console.log(boundingbox);
            $scope.findCoord(boundingbox);
        });
    };

    /**
     * Sends coordinates as search parameters
     * @param {*} boundingbox 
     */
    $scope.findCoord = function (boundingbox) {

        if ($scope.requestsCounter === 0) {
            var maxLat = boundingbox[0][1].lat;
            var minLat = boundingbox[0][0].lat;
            var maxLng = boundingbox[0][2].lng;
            var minLng = boundingbox[0][0].lng;
            $.ajax({
                url: 'http://localhost:10002/searchCoordinates',
                type: 'get',
                data: {
                    maxLat: maxLat,
                    minLat: minLat,
                    maxLng: maxLng,
                    minLng: minLng
                },
                success: function (data) {
                    if (data.length !== 0) {
                        $scope.showResults(data);
                    } else {
                        swal({
                            titel: 'Error',
                            text: "No results!",
                            type: 'error',
                            customClass: 'swalCc',
                            buttonsStyling: false,
                        });
                    }
                },
                error: function (message) {
                    swal({
                        titel: 'Error',
                        text: message,
                        type: 'error',
                        customClass: 'swalCc',
                        buttonsStyling: false,
                    });
                }
            });
            $scope.requestsCounter++;
        }

    };

    //for the extended search animation 
    $scope.toggleChecked = function () {
        $scope.checked = !$scope.checked;
    };

    /**
     * A pop-up for help
     */
    $scope.help = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '../templates/popups/help.html',
            controller: 'helpController',
            size: 'lg'
        });
    };

    /**
     * A pop-up for compute
     */
    $scope.compute = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '../templates/popups/compute.html',
            controller: 'computeController',
            size: 'lg'
        });
    };

    /**
     * A pop-up for bandcolors
     */
    $scope.bandColor = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '../templates/popups/bandColor.html',
            controller: 'bandColor',
            size: 'lg'
        });
    };

    $scope.changeOpacity = function () {
        console.log($scope.rangeValue);
        var opacity = $scope.opacityValue / 100;
        $scope.tilesLayer.setOpacity(opacity);
    }

    $scope.fadeOverlay = function () {
        if ($scope.overlayVisible) {
            var opacity = $scope.opacityValue / 100;
            $scope.tilesLayer.setOpacity(opacity);
        } else {
            $scope.tilesLayer.setOpacity(0);
        }
    }

}]);