import { Server } from 'socket.io';
import config from 'src/config.js';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import csurf from 'csurf';
import express from 'express';
import http from 'http';
import multer from 'multer';
import session from 'express-session';

import roomRouter from './routes/room.js';

const sessionMiddleware = session({
    secret: config.SECRET,
    cookie: { secure: !config.DEBUG },
    saveUninitialized: false,
    resave: false,
});

const app = express();
const http_server = http.createServer(app);
const io  = new Server();
io.listen(http_server);


const csrf = csurf({ cookie: true });

app.use('/js',  express.static('dist/frontend/js'));
app.use('/css', express.static('dist/frontend/css'));
app.use('/assets', express.static('assets'));
app.use(sessionMiddleware);
app.use(cookieParser());
app.use(multer().none());
app.use(express.urlencoded({ extended: false }));
app.use((req, _, next) => {
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

app.set('trust proxy', config.TRUST_PROXY? 1:0);

app.set('view engine', 'ejs');

app.use('/room', roomRouter(csrf, io, (socket, next) => (sessionMiddleware(socket.request, socket.request.res || {}, next))));

app.get('/', csrf, (req, res) => {
    res.render('index', { csrfToken: req.csrfToken() });
});

http_server.listen(config.PORT, () => {
    // TODO: add some logging that we're listening.
});
