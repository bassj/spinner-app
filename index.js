const cookieParser  = require('cookie-parser');
const express       = require('express');
const session       = require('express-session');
const socketio      = require('socket.io');
const multer        = require('multer');
const crypto        = require('crypto');
const csurf         = require('csurf');
const https         = require('https');
const http          = require('http');

const app = express();
const http_server = http.createServer(app);
const io  = new socketio.Server();
      io.listen(http_server);

const options = require('./options');

const csrf = csurf({ cookie: true });

app.use('/static', express.static('static'));
app.use(session({
    secret: options.SECRET,
    cookie: { secure: !options.DEBUG },
    saveUninitialized: false,
    resave: false,
}));
app.use(cookieParser());
app.use(multer().none());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
    if (!req.session.user_id) {
        crypto.randomBytes(64, (err, buf) => {
            if (err) throw err;
            req.session.user_id = buf.toString('base64');
            req.session.save(next);
        });
    } else {
        next();
    }
});

app.set('trust proxy', options.TRUST_PROXY? 1:0);

app.set('view engine', 'ejs');

app.use('/room', require('./routes/room.js')(csrf, io));

app.get('/', csrf, (req, res) => {
    res.render('index', { csrfToken: req.csrfToken() });
});

http_server.listen(options.PORT, () => {
    console.log(`Listening on ${options.PORT}`); 
});
