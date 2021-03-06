var uberApp = angular.module('uberApp');
uberApp.controller("ridesController",function($scope, $state, $http, $window, NgMap, $uibModal, uberService){
	var Map;
	var source_address = {};
	var destination_address = {};
	var driverData = {};
	$scope.ridesHistory = [];
	$scope.driverReviews = [];
	$scope.driverReviewsArray = [];
	$scope.currCursor = 0;
	$scope.noScroll = false;
	$scope.count = 0;
	
	uberService.setRideHider(true);
	 
	NgMap.getMap().then(function(map) {
	    Map = map;
	  });
	$scope.ratingg = 5;
	
    $scope.buttonLabel = "Request Ride";

    $http.get('/getPendingReview').success(function(response){
    	
    	if(response.statusCode == 200){
    		if(response.message.status!="2"){
    			var modalInstance = $uibModal.open({
      		      animation: $scope.animationsEnabled,
      		      templateUrl: 'myModal.html',
      		      controller : 'modalController',
      		      backdrop  : 'static',
      		      keyboard : false,
      		      resolve: {
      		        param: function () {
      		          return {rideDetails: response.message};
      		        }
      		      }
      		    }); 
    		}
    	}
    	else{
    	        // $("myImageModal").modal("show");
    		console.log("Reached else");
    	 }
    	
    });
   
	$scope.fetchDrivers = function(source, destination){
		$scope.errorDialog = false;
		distance = Map.directionsRenderers[0].directions.routes[0].legs[0].distance.value * 0.000621371;
		console.log(distance);
		console.log("Source +"+ source);
		getAddress(source, function(response){
			if(response.success){
				 source_address = response;
				 getAddress(destination, function(response){
					 $scope.errorDialog = false;
						if(response.success){
							destination_address = response;
							$http.get('/getDriverLocations/'+source_address.lat+'/'+source_address.lng).success(function(response){

								if(response.statusCode == 200){
									$scope.positions = response.message.locations;
									driverData = response.message.driverData;
									console.log("Locations "+JSON.stringify(response.message.locations));
								
								}
								else{
									$scope.errorDialog = true;
									$scope.errorMessage = response.message;
								}
							});
						}
					});
			}
		
		});
		
		
		
	}
	
	$scope.placeChanged = function(){
		$scope.positions = [];
	}
	
	$scope.positions = [];

	$scope.showDriverDetails = function(event,position) {
		console.log("Position is "+JSON.stringify(position));
		$scope.driverPanel = true;
		$scope.driver = driverData[position._id.toString()];
		$scope.driverId = position._id;
		//window.scrollTo(0,document.body.scrollHeight);
		$http.get('/getDriverReviews/'+$scope.driverId).success(function(response){
			if(response.statusCode == 200){	
				 $scope.driverReviews=response.message;
			     
				} 
			
		});

		console.log("driver Data "+JSON.stringify(driverData));
		window.scrollTo(0,document.body.scrollHeight);
		
		}
	$scope.loadMore = function(){
			
			if(!$scope.noScroll ){
				
				console.log("count is "+$scope.ridesHistory.length);
				$scope.noScroll = true;
				$http.get('/getCustomerRidesHistory/'+$scope.count).success(function(response){
					if(response.statusCode == 200){	
						$scope.count = $scope.count + 10;
						for(msg in response.message){
							$scope.ridesHistory.push(response.message[msg]);
						} 
						
						$scope.noScroll = false;
					}
					else
						$scope.noScroll = true;
					
				});
			}	
	}
	
	$scope.loadDriverReviews = function(){
		var range = 10;		
		if(($scope.currCursor + range) > $scope.driverReviews.length)	{
			range = $scope.driverReviews.length - $scope.currCursor;
		}						
		$scope.driverReviewsArray=[];
		for(var i = $scope.currCursor ; i < range ; i++)	{
			$scope.driverReviewsArray.push($scope.driverReviews[i]);
		}
	}
	
	function getAddress(location, callback){
		  if(location.length >= 5 && typeof google != 'undefined'){
		    var addr = {};
		    var geocoder = new google.maps.Geocoder();
		    geocoder.geocode({ 'address': location }, function(results, status){
		    	console.log("results" +JSON.stringify(results));
		        addr.lat = results[0].geometry.location.lat();
		        addr.lng = results[0].geometry.location.lng()
		      if (status == google.maps.GeocoderStatus.OK){
		        if (results.length >= 1) {
			  for (var ii = 0; ii < results[0].address_components.length; ii++){
			    var street_number = route = street = city = state = zipcode = country = formatted_address = '';
			    var types = results[0].address_components[ii].types.join(",");
			    if (types == "street_number"){
			      addr.street_number = results[0].address_components[ii].long_name;
			    }
			    if (types == "route" || types == "point_of_interest,establishment"){
			      addr.street_name = results[0].address_components[ii].long_name;
			    }
			    if (types == "sublocality,political" || types == "locality,political" || types == "neighborhood,political" || types == "administrative_area_level_3,political"){
			      addr.city = (city == '' || types == "locality,political") ? results[0].address_components[ii].long_name : city;
			    }
			    if (types == "administrative_area_level_1,political"){
			      addr.state = results[0].address_components[ii].short_name;
			    }
			    if (types == "postal_code" || types == "postal_code_prefix,postal_code"){
			      addr.zipcode = results[0].address_components[ii].long_name;
			    }
			    if (types == "country,political"){
			      addr.country = results[0].address_components[ii].long_name;
			    }
			  }
			  addr.success = true;
			  
			  if(!(addr.hasOwnProperty("street_number"))){
				  addr.street_number = "";
			  }
			  if(!(addr.hasOwnProperty("street_name"))){
				  addr.street_name = "";
			  }
			  if(!(addr.hasOwnProperty("city"))){
				  addr.city = "";
			  }
			  if(!(addr.hasOwnProperty("state"))){
				  addr.state = "";
			  }
			  if(!(addr.hasOwnProperty("zipcode"))){
				  addr.zipcode = null;
			  }
			  if(!(addr.hasOwnProperty("country"))){
				  addr.country = "";
			  }
			  callback(addr);
		        } else {
		          response({success:false});
		        }
		      } else {
		        response({success:false});
		      }
		    });
		  } else {
		    callback({success:false});
		  }
	}
	
	$scope.requestRide = function(driverId){
		
		var source = new google.maps.LatLng(source_address.lat, source_address.lng);
	    var dest = new google.maps.LatLng(destination_address.lat, destination_address.lng);
	    var distance = Map.directionsRenderers[0].directions.routes[0].legs[0].distance.value * 0.000621371;
		locations = {source_location : {lat : source_address.lat, lng : source_address.lng},
					destination_location : {lat : destination_address.lat, lng : destination_address.lng}};
		var yyyy = new Date().getFullYear().toString();                                    
        var mm = (new Date().getMonth()+1).toString(); // getMonth() is zero-based         
        var dd  = new Date().getDate().toString();             
                            
        var billing_date=yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
		rideData = {
				
				"driver_id" : driverId,
				
				"source_street" : source_address.street_number,
				"source_area" : source_address.street_name,
				"source_city" : source_address.city,
				"source_state" : source_address.state,
				"source_zipcode" : source_address.zipcode,
				
				"destination_street" : destination_address.street_number,
				"destination_area" : destination_address.street_name,
				"destination_city" : destination_address.city,
				"destination_state" : destination_address.state,
				"destination_zipcode" : destination_address.zipcode,
				"distance" : distance,
				"billing_date":billing_date
	
		};
		
		$http.put('/createRide', {rideData : rideData,locations : locations }).success(function(response){
			
			
			if(response.statusCode == 200){
				console.log(response.message)
				var rideId=response.message;
				uberService.setRideId(rideId);
				uberService.setRideHider(false);
				$state.go('updateRide',{"rideId" : rideId});
			}
			
		});
		
	}

});