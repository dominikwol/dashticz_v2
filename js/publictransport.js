function loadPublicTransport(random,transportobject){
	var width = 12;
	if(typeof(transportobject.width)!=='undefined') width=transportobject.width;
	var html='<div class="publictransport'+random+' col-xs-'+width+' transbg">';
			html+='<div class="col-xs-2 col-icon">';
				html+='<em class="fa fa-'+transportobject.icon+'"></em>';
			html+='</div>';
			html+='<div class="col-xs-10 col-data">';
				html+='<span class="state"></span>';
			html+='</div>';
		html+='</div>';	
	
	//Get data every interval and call function to create block
	var interval = 60;
	if(typeof(transportobject.interval)!=='undefined') interval = transportobject.interval;
	getData(random,transportobject);
	
	if(transportobject.provider.toLowerCase() == 'ns'){
		if(parseFloat(interval)<60) interval=60; // limit request because of limitations in NS api for my private key ;)
	}
	
	setInterval(function(){
		getData(random,transportobject)
	},(interval * 1000));
	return html;
}

function getData(random,transportobject){
	var provider = transportobject.provider.toLowerCase();
	if(provider == 'vvs'){
		dataURL = 'https://efa-api.asw.io/api/v1/station/'+transportobject.station+'/departures/';
	}
	else if(provider == '9292' || provider == '9292-train' || provider == '9292-bus'){
		dataURL = 'https://cors-anywhere.herokuapp.com/http://api.9292.nl/0.1/locations/'+transportobject.station+'/departure-times?lang=nl-NL&time='+$.now();
	}
	
	$('.publictransport'+random+' .state').html('Loading...');
	$.getJSON(dataURL,function(data){
		dataPublicTransport(random,data,transportobject);
	});
	
}
function dataPublicTransport(random,data,transportobject){
	var provider = transportobject.provider.toLowerCase();
	var dataPart = {}
	var i = 0;
	for(d in data){
		if(provider == '9292' || provider == '9292-train' || provider == '9292-bus'){
			for(t in data[d]){
				if(provider == '9292' || 
				   (data[d][t]['id']=='bus' && provider == '9292-bus') || 
				   (data[d][t]['id']=='trein' && provider == '9292-train')
				){
					deps = data[d][t]['departures'];
					for(de in deps){
						if(typeof(dataPart[deps[de]['time']])=='undefined') dataPart[deps[de]['time']]=[];
						dataPart[deps[de]['time']][i]='';
						dataPart[deps[de]['time']][i]+='<div><b>'+deps[de]['time']+'</b> ';
						if(typeof(deps[de]['VertrekVertragingTekst'])!=='undefined') dataPart[deps[de]['time']][i]+='<span id="latetrain">'+deps[de]['VertrekVertragingTekst']+'</span> ';
						if(deps[de]['platform']!=null) dataPart[deps[de]['time']][i]+='- Spoor '+deps[de]['platform'];
						else dataPart[deps[de]['time']][i]+='- Lijn '+deps[de]['service'];
						dataPart[deps[de]['time']][i]+=' - '+deps[de]['destinationName'];
						if(typeof(deps[de]['RouteTekst'])!=='undefined') dataPart[deps[de]['time']][i]+=' <em> via '+deps[de]['viaNames']+'</em>';
						dataPart[deps[de]['time']][i]+=' </div>';
					}
				}
			}
		}
		else if(provider == 'vvs'){
			arrivalTime = addZero(data[d]['departureTime']['hour'])+':'+addZero(data[d]['departureTime']['minute']);
			if(typeof(dataPart[arrivalTime])=='undefined') dataPart[arrivalTime]=[];
			dataPart[arrivalTime][i] = '';
			arrivalTimeScheduled = addMinutes(arrivalTime, data[d]['delay']*-1);
			dataPart[arrivalTime][i]+='<div><b>'+arrivalTime+'</b> ';
			if(data[d]['delay'] == 0) latecolor='notlatetrain';	
			if(data[d]['delay'] > 0) latecolor='latetrain';
			dataPart[arrivalTime][i]+='<span id="'+latecolor+'">+'+data[d]['delay']+' Min.</span> ';
			dataPart[arrivalTime][i]+='<span id="departureScheduled">('+lang['scheduled']+': '+arrivalTimeScheduled+')</span> ';
			dataPart[arrivalTime][i]+='- '+data[d]['number']+' '+data[d]['direction']+'</div>';
		}
		i = i+1;
		if (i === transportobject.results) { break; }
	}
	
	$('.publictransport'+random+' .state').html('');
	var c = 1;
	Object.keys(dataPart).sort().forEach(function(d) {
		for(p in dataPart[d]){
			if(c<=10) $('.publictransport'+random+' .state').append(dataPart[d][p]);
			c++;
		}
	});
	
	var dt = new Date();
	$('.publictransport'+random+' .state').append('<em>'+lang['last_update']+': '+addZero(dt.getHours()) + ":"+addZero(dt.getMinutes())+":"+addZero(dt.getSeconds())+'</em>')
}

function addZero(input){
	if(input < 10){
		return '0' + input;
	}
	else{
		return input;
	}
}
function addMinutes(time/*"hh:mm"*/, minsToAdd/*"N"*/) {
  function z(n){
    return (n<10? '0':'') + n;
  }
  var bits = time.split(':');
  var mins = bits[0]*60 + (+bits[1]) + (+minsToAdd);

  return z(mins%(24*60)/60 | 0) + ':' + z(mins%60);  
} 