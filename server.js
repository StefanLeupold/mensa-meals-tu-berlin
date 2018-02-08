const request = require('request');
const async = require('async');
const cheerio = require('cheerio');
const express = require('express');
const app = express();

app.use(express.static('public')); // make folder public available (for .css file)
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
    //res.render('index');
    //fetchParseMensa(55, function(err, res) {
    //    console.log(res);
    //});

    // map function collections results of each fetchParseMensa call in a list and runs new function when all are done
    mensa_ids = [55, 51, 53, 57]; // 53, 57
    async.map(mensa_ids, fetchParseMensa, function (error, mapResult) {
        if (error) console.log(error);
        console.log(mapResult);
        res.render('index', {mensen: mapResult, error: error});
    });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
});

function parseMensaData(html, idDateString) {
    var mealList = [];
    var mensaTitle = "";
    var $ = cheerio.load(html);

    var currentDayDiv = $('div[id='+idDateString+']');
    mensaTitle = currentDayDiv.find('h1').text().split("Speiseplan: ")[1];
    //console.log("mensa title: " + mensaTitle);
    //console.log(currentDayDiv.find('h3').text());

    var lastDivider;

    currentDayDiv.find('li').each( function(i, elem) {

        if ($(this).hasClass('groupdivider')) {
            lastDivider = $(this).find('div').text();
        }

        if (lastDivider == "Aktionen" || lastDivider == "Essen") {
            var results = $(this).find('h3').text();
            if (results) {
                //console.log(results);
                mealList.push(results);
            }
        }

    } );

    return {"title": mensaTitle, "meals": mealList};
}


function fetchParseMensa(id, callback, todayPlus=0) {
    let dayOfYear = Math.round((new Date().setHours(23) - new Date(new Date().getYear()+1900, 0, 1, 0, 0, 0))/1000/60/60/24) - 1 + todayPlus;
    let year = new Date().getYear() + 1900;
    var idDateString = `id${id}_tag_${year}${dayOfYear}`;
    var url =  'https://app.stw.berlin/essen.php?v=5060297&hyp=1&lang=de&mensa=id'+ id + '#' + idDateString;
    //console.log(url);
    //console.log(idDateString);

    request(url, function (error, response, html) {
        var parsed = "";
        if (!error && response.statusCode == 200) {
            parsed = parseMensaData(html, idDateString);
        }
        callback(error, parsed);
    });



}
