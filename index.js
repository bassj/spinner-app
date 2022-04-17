const cookieParser = require('cookie-parser');
const express       = require('express');
const session       = require('express-session');
const csurf         = require('csurf');

const app = express();

const options = require('./options');

const csrf = csurf({ cookie: true });

app.use(session({
    secret: options.SECRET,
    cookie: { secure: !options.DEBUG },
    saveUninitialized: true,
    resave: false,
}));

app.use(cookieParser());

app.set('trust proxy', options.TRUST_PROXY? 1:0);

app.set('view engine', 'ejs');
app.use('/static', express.static('static'));
app.use(express.urlencoded({ extended: false }));
app.use('/room', require('./routes/room.js')(csrf));

app.get('/', csrf, (req, res) => {
    res.render('index', { csrfToken: req.csrfToken() });
});

app.listen(options.PORT, () => {
    console.log(`Listening on ${options.PORT}`); 
});
