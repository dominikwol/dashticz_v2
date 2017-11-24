function loadGarbage() {
    var random = getRandomInt(1, 100000);

    var width = 12;
    if (typeof(settings['garbage_width']) !== 'undefined' && parseFloat(settings['garbage_width']) > 0) width = settings['garbage_width'];

    var html = '<div class="trash trash' + random + ' block_garbage col-xs-' + width + ' transbg" data-id="garbage">';
    if (typeof(settings['garbage_hideicon']) !== 'undefined' && parseFloat(settings['garbage_hideicon']) === 1) {
        html += '<div class="col-xs-12 col-data">';
    } else {
        html += '<div class="col-xs-4 col-icon">';
        html += '<img class="trashcan" src="img/kliko.png" style="opacity:0.1" />';
        html += '</div>';
        html += '<div class="col-xs-8 col-data">';
    }
    html += '<span class="state">' + language.misc.loading + '</span>';
    html += '</div>';
    html += '</div>';

    loadDataForService(settings['garbage_company'], random);

    setTimeout(function () {
        loadGarbage();
    }, (60000 * 15));

    return html;
}

function getIcalData(address, date, random, url) {
    var baseIcalUrl = 'https://wedevise.nl/dashticz/ical/demo/?url=';
    $.getJSON(baseIcalUrl + url, function (data, textstatus, jqXHR) {
        respArray = data;
        this.counter = 0;
        this.returnDates = {};
        for (var i in respArray) {
            var curr = respArray[i]['title'];
            curr = capitalizeFirstLetter(curr.toLowerCase());

            var testDate = moment(respArray[i].startt);
            if (testDate.isBetween(date.start, date.end, 'days', true)) {
                if (typeof(this.returnDates[curr]) === 'undefined') {
                    this.returnDates[curr] = {};
                }
                this.returnDates[curr][testDate.format('YYYY-MM-DD') + this.counter] = getTrashRow(curr, testDate, respArray[i]['title']);
                this.counter++;
            }
        }
        addToContainer(random, this.returnDates);
    });
}

function getDeAfvalAppData(address, date, random) {
    $.get('https://cors-anywhere.herokuapp.com/http://dataservice.deafvalapp.nl/dataservice/DataServiceServlet?type=ANDROID&service=OPHAALSCHEMA&land=NL&postcode=' + address.postcode + '&straatId=0&huisnr=' + address.housenumber + '&huisnrtoev=' + address.housenumberSuffix, function (data) {
        var respArray = data.toString().split('\n').join('').split(';');
        respArray.pop();
        this.returnDates = {};
        this.counter = 0;
        var curr;
        var dates;
        for (var i in respArray) {
            if (isNaN(parseInt(respArray[i]))) {
                dates[respArray[i]] = [];
                curr = respArray[i];
                curr = capitalizeFirstLetter(curr.toLowerCase());
            } else {
                var testDate = moment(respArray[i], 'DD-MM-YYYY');
                if (testDate.isBetween(date.start, date.end, 'days', true)) {
                    if (typeof(this.returnDates[curr]) === 'undefined') {
                        this.returnDates[curr] = {}
                    }
                    this.returnDates[curr][testDate.format('YYYY-MM-DD') + this.counter] = getTrashRow(curr, testDate);
                    this.counter++;
                }
            }
        }
        addToContainer(random, this.returnDates);
    });
}

function getTwenteMilieuData(address, date, random) {
    $.post('https://wasteapi.2go-mobile.com/api/FetchAdress', {
        'companyCode': '8d97bb56-5afd-4cbc-a651-b4f7314264b4',
        'postCode': address.postcode,
        'houseNumber': address.housenumber,
        'houseLetter': '',
        'houseNumberAddition': address.housenumberSuffix
    }, function (data) {
        $.post('https://wasteapi.2go-mobile.com/api/GetCalendar', {
            'companyCode': '8d97bb56-5afd-4cbc-a651-b4f7314264b4',
            'uniqueAddressID': data['dataList'][0]['UniqueId'],
            'startDate': date.start.format('YYYY-MM-DD'),
            'endDate': date.end.format('YYYY-MM-DD')
        }, function (data) {
            this.returnDates = {};
            data = data.dataList;
            for (d in data) {
                var curr = data[d].description;
                curr = capitalizeFirstLetter(curr.toLowerCase());
                if (typeof(this.returnDates[curr]) == 'undefined') {
                    this.returnDates[curr] = {}
                }

                for (dt in data[d].pickupDates) {
                    var testDate = moment(data[d].pickupDates[dt]);
                    if (testDate.isBetween(date.start, date.end, 'days', true)) {
                        this.returnDates[curr][testDate.format('YYYY-MM-DD') + '_' + curr] = getTrashRow(curr, testDate);
                    }
                }
            }
            addToContainer(random, this.returnDates);
        });
    });

}

function getAfvalstromenData(address, date, random, baseUrl) {
    $('.trash' + random + ' .state').html('');
    $.getJSON('https://cors-anywhere.herokuapp.com/' + baseUrl + '/rest/adressen/' + address.postcode + '-' + address.housenumber, function (data) {
        $.getJSON('https://cors-anywhere.herokuapp.com/' + baseUrl + '/rest/adressen/' + data[0].bagId + '/afvalstromen', function (data) {
            this.counter = 0;
            this.returnDates = {};
            for (d in data) {
                if (data[d]['ophaaldatum'] !== null) {
                    var curr = data[d]['menu_title'];
                    curr = capitalizeFirstLetter(curr.toLowerCase());
                    if (typeof(this.returnDates[curr]) === 'undefined') {
                        this.returnDates[curr] = {}
                    }
                    var testDate = moment(moment(data[d]['ophaaldatum']));
                    this.returnDates[curr][testDate.format('YYYY-MM-DD') + '_' + this.counter] = getTrashRow(curr, testDate);
                    this.counter++;
                }
            }

            addToContainer(random, this.returnDates);
        });
    });
}

function getOphaalkalenderData(address, date, random) {
    $('.trash' + random + ' .state').html('');

    this.baseURL = 'http://www.ophaalkalender.be';
    this.counter = 0;
    this.returnDates = {};

    $.getJSON('https://cors-anywhere.herokuapp.com/' + this.baseURL + '/calendar/findstreets/?query=' + address.street + '&zipcode=' + address.postcode, function (data) {
        $.getJSON('https://cors-anywhere.herokuapp.com/' + this.baseURL + '/api/rides?id=' + data[0].Id + '&housenumber=0&zipcode=' + address.postcode, function (data) {

            for (d in data) {
                var curr = data[d]['title'];
                curr = capitalizeFirstLetter(curr.toLowerCase());
                if (typeof(this.returnDates[curr]) === 'undefined') {
                    this.returnDates[curr] = {}
                }
                var testDate = moment(moment(data[d]['start']));
                if (testDate.isBetween(date.start, date.end, 'days', true)) {
                    this.returnDates[curr][testDate.format('YYYY-MM-DD') + '_' + this.counter] = getTrashRow(curr, testDate, data[d]['color']);
                    this.counter++;
                }
            }

            addToContainer(random, returnDates);
        });
    });
}

function getAfvalwijzerArnhemData(address, date, random) {
    $('.trash' + random + ' .state').html('');
    this.returnDates = {};
    var baseURL = 'http://www.afvalwijzer-arnhem.nl';
    $.get('https://cors-anywhere.herokuapp.com/' + baseURL + '/applicatie?ZipCode=' + address.postcode + '&HouseNumber=' + address.housenumber + '&HouseNumberAddition=' + address.housenumberSuffix, function (data) {
        $(data).find('ul.ulPickupDates li').each(function () {
            var row = $(this).html().split('</div>');
            var curr = row[0].replace('<div>', '').trim();
            var testDate = moment(row[1].trim(), 'DD-MM-YYYY');
            if (testDate.isBetween(date.start, date.end, 'days', true)) {
                if (typeof(this.returnDates[curr]) === 'undefined') {
                    returnDates[curr] = {}
                }
                returnDates[curr][testDate.format('YYYY-MM-DD') + '_' + curr] = getTrashRow(curr, testDate);
            }
        });
        addToContainer(random, this.returnDates);
    });
}

function getMijnAfvalwijzerData(address, date, random) {
    $.getJSON('https://cors-anywhere.herokuapp.com/http://json.mijnafvalwijzer.nl/?method=postcodecheck&postcode=' + address.postcode + '&street=&huisnummer=' + address.housenumber + '&toevoeging=' + address.housenumberSuffix, function (data) {
        data = data.data.ophaaldagen.data;
        this.returnDates = {};
        for (d in data) {
            var curr = data[d]['nameType'];
            curr = capitalizeFirstLetter(curr.toLowerCase());

            var testDate = moment(data[d]['date']);
            if (testDate.isBetween(date.start, date.end, 'days', true)) {
                if (typeof(this.returnDates[curr]) === 'undefined') {
                    this.returnDates[curr] = {}
                }
                this.returnDates[curr][testDate.format('YYYY-MM-DD') + '_' + curr] = getTrashRow(curr, testDate);
            }
        }
        addToContainer(random, this.returnDates);
    });
}

function getHvcData(address, date, random) {
    $.getJSON('https://cors-anywhere.herokuapp.com/http://inzamelkalender.hvcgroep.nl/push/calendar?postcode=' + address.postcode + '&huisnummer=' + address.housenumber, function (data) {
        this.returnDates = {};
        for (d in data) {
            var curr = data[d].naam;
            curr = capitalizeFirstLetter(curr.toLowerCase());
            if (typeof(this.returnDates[curr]) === 'undefined') {
                this.returnDates[curr] = {}
            }

            for (dt in data[d].dateTime) {
                var testDate = moment(data[d].dateTime[dt].date);
                if (testDate.isBetween(date.start, date.end, 'days', true)) {
                    this.returnDates[curr][testDate.format('YYYY-MM-DD') + '_' + curr] = getTrashRow(curr, testDate);
                }
            }
        }
        addToContainer(random, this.returnDates);
    });
}

function getRovaData(address, date, random) {
    $.getJSON('https://wedevise.nl/dashticz/rova.php?zipcode=' + address.postcode + '&number=' + address.housenumber, function (data) {
        this.returnDates = {};
        this.counter = 0;
        for (d in data) {
            var curr = data[d].GarbageType;
            curr = capitalizeFirstLetter(curr.toLowerCase());
            if (typeof(this.returnDates[curr]) === 'undefined') {
                this.returnDates[curr] = {}
            }

            var testDate = moment(data[d].Date);
            if (testDate.isBetween(date.start, date.end, 'days', true)) {
                this.returnDates[curr][testDate.format('YYYY-MM-DD') + '_' + this.counter] = getTrashRow(curr, testDate);
                this.counter++;
            }
        }
        addToContainer(random, this.returnDates);
    });
}

function getRecycleManagerData(address, date, random) {
    $.getJSON('https://vpn-wec-api.recyclemanager.nl/v2/calendars?postalcode=' + address.postcode + '&number=' + address.housenumber, function (data) {
        this.returnDates = {};
        this.counter = 0;
        for (d in data.data) {
            for (o in data.data[d].occurrences) {
                var curr = data.data[d].occurrences[o].title;
                curr = capitalizeFirstLetter(curr.toLowerCase());
                if (typeof(this.returnDates[curr]) === 'undefined') {
                    this.returnDates[curr] = {}
                }

                var testDate = moment(data.data[d].occurrences[o].from.date);
                if (testDate.isBetween(date.start, date.end, 'days', true)) {
                    this.returnDates[curr][testDate.format('YYYY-MM-DD') + '_' + this.counter] = getTrashRow(curr, testDate);
                    this.counter++;
                }
            }
        }
        addToContainer(random, this.returnDates);
    });
}

function getEdgData(address, date, random) {
    $.getJSON('https://cors-anywhere.herokuapp.com/https://www.edg.de/JsonHandler.ashx?dates=1&street=' + address.street + '&nr=' + address.housenumber + '&cmd=findtrash&tbio=0&tpapier=1&trest=1&twert=1&feiertag=0', function (data) {
        data = data.data;
        this.returnDates = {};
        this.counter = 0;
        var curr = '';

        for (d in data) {
            if (typeof(returnDates[curr]) === 'undefined') {
                this.returnDates[curr] = {}
            }

            var testDate = moment(data[d]['date']);
            if (testDate.isBetween(date.start, date.end, 'days', true)) {
                for (e in data[d].fraktion) {
                    this.returnDates[curr][moment(data[d]['date']).format('YYYY-MM-DD')] = getTrashRow(data[d].fraktion[e], testDate);
                    this.counter++;
                }
            }
        }
        addToContainer(random, this.returnDates);
    });
}

function getTrashRow(c, d, orgcolor) {
    color = '';
    if (typeof(trashcolors) !== 'undefined' && typeof(trashcolors[c]) !== 'undefined') color = ' style="color:' + trashcolors[c] + '"';
    if (typeof(trashnames) !== 'undefined' && typeof(trashnames[c]) !== 'undefined') c = trashnames[c];

    if (c.length === 0) return '';
    if (c.substr(0, 7) == 'Bo zl12') {
        if (c.toLowerCase().indexOf("gft") > 0) c = 'GFT';
        else if (c.toLowerCase().indexOf("rest") > 0) c = 'Restafval';
        else if (c.toLowerCase().indexOf("vec") > 0) c = 'Verpakkingen';
    }
    orgcolor_attr = ' data-color="' + color + '";';
    if (typeof(orgcolor) !== 'undefined') orgcolor_attr = ' data-color="' + orgcolor + '"';

    return '<div class="trashrow"' + color + orgcolor_attr + '>' + c + ': ' + d.format('DD-MM-YYYY') + '</div>';
}

function addToContainer(random, returnDates) {
    var returnDatesSimple = {}
    var done = {};
    for (c in returnDates) {
        for (cr in returnDates[c]) {
            if (returnDates[c][cr] == '') continue;
            returnDatesSimple[cr] = returnDates[c][cr];
            done[c] = true;
        }
    }

    $('.trash' + random + ' .state').html('');

    if (typeof(_DO_NOT_USE_COLORED_TRASHCAN) === 'undefined' || _DO_NOT_USE_COLORED_TRASHCAN === false) {
        $('.trash' + random).find('img.trashcan').css('opacity', '0.7');
    }
    else {
        $('.trash' + random).find('img.trashcan').css('opacity', '1');
    }
    Object.keys(returnDatesSimple).sort().slice(0, getMaxItems()).forEach(function (key, index) {
        var skey = key.split('_');
        skey = skey[0];
        var date = moment(skey).format('DD-MM-YYYY');
        var currentdate = moment();
        var tomorrow = moment().add(1, 'days');
        var nextweek = moment().add(6, 'days');

        if (index === 0 && (typeof(_DO_NOT_USE_COLORED_TRASHCAN) === 'undefined' || _DO_NOT_USE_COLORED_TRASHCAN === false)) {
            $('.trash' + random).find('img.trashcan').attr('src', getKlikoImage(returnDatesSimple[key].toLowerCase()));
        }

        if (date === currentdate.format('DD-MM-YYYY')) {
            returnDatesSimple[key] = returnDatesSimple[key].replace(date, language.weekdays.today);
            returnDatesSimple[key] = returnDatesSimple[key].replace('trashrow', 'trashtoday');
        }
        else if (date === tomorrow.format('DD-MM-YYYY')) {
            returnDatesSimple[key] = returnDatesSimple[key].replace(date, language.weekdays.tomorrow);
            returnDatesSimple[key] = returnDatesSimple[key].replace('trashrow', 'trashtomorrow');
        }
        else if (moment(skey).isBetween(currentdate, nextweek, 'days', true)) {
            var datename = moment(date, 'DD-MM-YYYY').locale(settings['calendarlanguage']).format('dddd');
            datename = datename.charAt(0).toUpperCase() + datename.slice(1);
            returnDatesSimple[key] = returnDatesSimple[key].replace(date, datename);
        }

        $('.trash' + random + ' .state').append(returnDatesSimple[key]);
    });
}

function getKlikoImage(element) {
    if (element.indexOf('gft') >= 0 ||
        element.indexOf('tuin') >= 0 ||
        element.indexOf('refuse bin') >= 0
    ) {
        return 'img/kliko_green.png';
    }
    else if (element.indexOf('plastic') >= 0 ||
        element.indexOf('pmd') >= 0
    ) {
        return 'img/kliko_orange.png';
    }
    else if (element.indexOf('rest') >= 0 ||
        element.indexOf('grof') >= 0
    ) {
        return 'img/kliko_grey.png';
    }
    else if (element.indexOf('papier') >= 0 ||
        element.indexOf('blauw') >= 0 ||
        element.indexOf('recycling bin collection') >= 0
    ) {
        return 'img/kliko_blue.png';
    }
    else if (element.indexOf('chemisch') >= 0) {
        return 'img/kliko_red.png';
    }
    return 'img/kliko.png';
}

function getMaxItems() {
    if (typeof(settings['garbage_maxitems']) !== 'undefined'
        && parseFloat(settings['garbage_maxitems']) > 0
    ) {
        return settings['garbage_maxitems'];
    }
    return 5;
}

function getOmriData(address, date, random) {
    // $.post('http://www.omrin.nl/bij-mij-thuis/services/afvalkalender/',{
    //     'zipcode': address.postcode.substr(0,4),
    //     'zipcodeend':address.postcode.substr(4,6),
    //     'housenumber':address.housenumber,
    //     'addition':'',
    //     'send':'Mijn overzicht'
    // }, function(data) {
    //     console.log(data);
    // });
}

function loadDataForService(service, random) {
    var address = {
        street: settings['garbage_street'],
        housenumber: settings['garbage_housenumber'],
        housenumberSuffix: settings['garbage_housenumberadd'],
        postcode: settings['garbage_zipcode'],
    };
    var date = {
        start: moment(),
        end: moment().add(32, 'days'),
    };

    switch (service) {
        case 'ical':
            getIcalData(address, date, random, settings['garbage_icalurl']);
            break;
        case 'gemertbakelmaandag':
            getIcalData(address, date, random, 'https://calendar.google.com/calendar/ical/o44qrtdhls8saftmesm5rqb85o%40group.calendar.google.com/public/basic.ics');
            break;
        case 'gemertbakeldinsdag':
            getIcalData(address, date, random, 'https://calendar.google.com/calendar/ical/6p8549rssv114ddevingime95o%40group.calendar.google.com/public/basic.ics');
            break;
        case 'gemertbakelwoensdag':
            getIcalData(address, date, random, 'https://calendar.google.com/calendar/ical/cv40f4vaie10v54f72go6ipb78%40group.calendar.google.com/public/basic.ics');
            break;
        case 'veldhoven':
            getIcalData(address, date, random, 'https://www.veldhoven.nl/afvalkalender/2017/' + address.postcode + '-' + address.housenumber + '.ics');
            break;
        case 'best':
            getIcalData(address, date, random, 'https://www.gemeentebest.nl/afvalkalender/2017/' + address.postcode + '-' + address.housenumber + '.ics');
            break;
        case 'uden':
            getIcalData(address, date, random, 'https://www.uden.nl/inwoners/afval/ophaaldagen-afval/2017/' + address.postcode + '-' + address.housenumber + '.ics');
            break;
        case 'vianen':
            getIcalData(address, date, random, 'https://www.vianen.nl/afval/afvalkalender/2017/' + address.postcode + '-' + address.housenumber + '.ics');
            break;
        case 'goes':
            getIcalData(address, date, random, 'http://afvalkalender.goes.nl/2017/' + address.postcode + '-' + address.housenumber + '.ics');
            break;
        case 'deurne':
            getIcalData(address, date, random, 'http://afvalkalender.deurne.nl/Afvalkalender/download_ical.php?p=' + address.postcode + '&h=' + address.housenumber + '&t=&jaar=2017');
            break;
        case 'heezeleende':
            getIcalData(address, date, random, 'http://afvalkalender.heeze-leende.nl/Afvalkalender/download_ical.php?p=' + address.postcode + '&h=' + address.housenumber + '&t=&jaar=2017');
            break;
        case 'deafvalapp':
            getDeAfvalAppData(address, date, random);
            break;
        case 'twentemilieu':
            getTwenteMilieuData(address, date, random);
            break;

        case 'cure':
            getAfvalstromenData(address, date, random, 'https://afvalkalender.cure-afvalbeheer.nl');
            break;
        case 'cyclusnv':
            getAfvalstromenData(address, date, random, 'https://afvalkalender.cyclusnv.nl');
            break;
        case 'gemeenteberkelland':
            getAfvalstromenData(address, date, random, 'https://afvalkalender.gemeenteberkelland.nl');
            break;
        case 'meerlanden':
            getAfvalstromenData(address, date, random, 'https://afvalkalender.meerlanden.nl');
            break;
        case 'venray':
            getAfvalstromenData(address, date, random, 'https://afvalkalender.venray.nl');
            break;
        case 'circulusberkel':
            getAfvalstromenData(address, date, random, 'https://afvalkalender.circulus-berkel.nl');
            break;
        case 'rmn':
            getAfvalstromenData(address, date, random, 'https://inzamelschema.rmn.nl');
            break;
        case 'alphenaandenrijn':
            getAfvalstromenData(address, date, random, 'http://afvalkalender.alphenaandenrijn.nl');
            break;
        case 'sudwestfryslan':
            getAfvalstromenData(address, date, random, 'http://afvalkalender.sudwestfryslan.nl');
            break;
        case 'dar':
            getAfvalstromenData(address, date, random, 'https://afvalkalender.dar.nl');
            break;
        case 'waalre':
            getAfvalstromenData(address, date, random, 'https://afvalkalender.waalre.nl');
            break;
        case 'avalex':
            getAfvalstromenData(address, date, random, 'https://www.avalex.nl');
            break;

        case 'ophaalkalender':
            getOphaalkalenderData(address, date, random);
            break;
        case 'afvalwijzerarnhem':
            getAfvalwijzerArnhemData(address, date, random);
            break;
        case 'mijnafvalwijzer':
            getMijnAfvalwijzerData(address, date, random);
            break;
        case 'hvc':
            getHvcData(address, date, random);
            break;
        case 'rova':
            /* https://wedevise.nl/dashticz/rova.php?zipcode=7731ZT&number=84 */
            getRovaData(address, date, random);
            break;
        case 'recyclemanager':
            getRecycleManagerData(address, date, random);
            break;
        case 'edg':
            getEdgData(address, date, random);
            break;
        case 'omri':
            getOmriData(address, date, random);
            break;
    }
}
