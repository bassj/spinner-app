const expressWS     = require('express-ws');
const express       = require('express');
const session       = require('express-session');
const csurf         = require('csurf');
const https         = require('https');
const http          = require('http');

const app = express();
const ws  = expressWS(app);

const options = require('./options');

const csrf = csurf({ cookie: false });

app.use(session({
    secret: options.SECRET,
    cookie: { secure: !options.DEBUG },
    saveUninitialized: true,
    resave: false,
}));

app.set('trust proxy', options.TRUST_PROXY? 1:0);

app.set('view engine', 'ejs');
app.use('/static', express.static('static'));
app.use(express.urlencoded({ extended: true }));
app.use(csrf);
app.use('/room', require('./routes/room.js')());

app.get('/', (req, res) => {
    res.render('index', { csrfToken: req.csrfToken() });
});

app.listen(options.PORT, () => {
    console.log(`Listening on ${options.PORT}`); 
});
