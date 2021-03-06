const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');

const flash = require('connect-flash');
const session = require('express-session');
const app = express();
var cors = require('cors');

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'sql12.freemysqlhosting.net',
    user: 'sql12353688',
    password: 'xrrP6lqtDA',
    database: 'sql12353688'

});

connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});
// Passport Config
require('./config/passport')(passport);

// DB Config
const db = require('./config/keys').mongoURI;

// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));
//cors
app.use(cors())

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);
app.get('/autocomplete/', function (req, res) {
    //SELECT `Hospital` FROM `hospitals` WHERE `Hospital` LIKE '%a%'
    var results = [];
    var regex = new RegExp(req.query.term, 'i');

    connection.query('SELECT * FROM `hospitals` WHERE `Hospital`  LIKE + "%' + req.query.term + '%" OR `City`  LIKE + "%' + req.query.term + '%" ', function (err, rows, fields) {
        if (err) throw err;
        if (rows && rows.length && rows.length>0){
            //console.log(rows);
            for (i = 0; i < rows.length; i++) {
                results.push(rows[i]);   
            }
            res.jsonp(results);
        }
        
    })
    
});
app.get('/search/', function (req, res) {
    var results = [];
    //console.log(typeof req.query.q);
    
    connection.query('SELECT * FROM `hospitals` WHERE `Hospital` LIKE + "%' + ((req.query.q).split(","))[0] + '%"', function (err, rows, fields) {
        if (err) console.log(err);
        if (rows && rows.length && rows.length > 0) {
            console.log(rows);
            for (i = 0; i < rows.length; i++) {
                results.push(rows[i]);
                console.log(rows[i]);
            }
            res.jsonp(results);

        } else {
            res.jsonp(results);
        }

    })
});
app.get('/search-city/', function (req, res) {
    var results = [];

    connection.query('SELECT * FROM `hospitals` WHERE `City` LIKE + "%' + req.query.q + '%" ORDER BY score DESC', function (err, rows, fields) {
        if (err) console.log(err);
        if (rows && rows.length && rows.length >= 0) {
            console.log(rows);
            for (i = 0; i < rows.length; i++) {
                results.push(rows[i]);
                console.log(rows[i]);
            }
            res.jsonp(results);

        } else {
            res.jsonp(results);
        }

    })
});
app.get('/track', function (req, res) {
    const { name, city, beds, icu, vents } = req.query;
    connection.query('SELECT  * FROM `hospitals` WHERE `Hospital` = "' + req.query.track_this1 + '"', function (err, rows) {
        if (err) console.log(err);
        if (rows && rows.length && rows.length > 0) {
            //console.log(rows[0]);
            const t = rows[0].LAST_UPDATED;
            const b = rows[0].Beds;
            const i = rows[0].ICU;
            const v = rows[0].Ventilators;
          
            res.render('track', {
                Hospital: req.query.track_this1,
                City: req.query.track_this2,
                Beds:b,
                ICU: i,
                Ventilators: v
            })
        }
    })
    
});
app.get('/suggestion/', function (req, res) {
    var results = [];
    //console.log(typeof req.query.q);

    connection.query('SELECT * FROM `hospitals` WHERE `City` LIKE + "%' + ((req.query.q).split(","))[1] + '%" ORDER BY score DESC', function (err, rows, fields) {
        if (err) console.log(err);
        if (rows && rows.length && rows.length > 0) {
            console.log(rows);
            for (i = 0; i < rows.length; i++) {
                results.push(rows[i]);
                console.log(rows[i]);
            }
            res.jsonp(results);

        }

    })
});

app.get('/rectify/', function (req, res) {
    console.log(((req.query.q).split(","))[0]);
    req.session.rectify = ((req.query.q).split(","))[0];
});
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Exress validatr
//app.use(expressValidator())

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/index.js'));
app.use('/users', require('./routes/users.js'));
app.use('/about', require('./routes/about.js'));
app.use('/donate', require('./routes/donate.js'));
app.use('/contact', require('./routes/contact.js'));
//app.use('/robots.txt', require('./routes/robots.js'));

app.use(express.static('./public'))

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
app.use(express.static('./public'))

app.get('/app/', (req, res) => {
    res.download('./public/HospitalTracker.apk');
})
app.get('/robots.txt', function (req, res) {
        res.sendFile(__dirname + '/public/robots.txt')

});
app.get('/sitemap.xml', function (req, res) {
        res.sendFile(__dirname + '/public/sitemap.xml')

});