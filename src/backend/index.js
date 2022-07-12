import { Server } from 'socket.io';
import config from 'src/config.js';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import csurf from 'csurf';
import express from 'express';
import http from 'http';
import logger from 'logger';
import memorystore from 'memorystore';
import multer from 'multer';
import session from 'express-session';

import roomRouter from './routes/room.js';

const MemoryStore = memorystore(session);

const sessionMiddleware = session({
    secret: config.SECRET,
    store: new MemoryStore({
        checkPeriod: 86400000
    }),
    cookie: { secure: !config.DEBUG },
    saveUninitialized: false,
    resave: false,
});

const socketSessionMiddleware =
    (socket, next) => (sessionMiddleware(socket.request, socket.request.res || {}, next));

const app = express();
const http_server = http.createServer(app);
const io  = new Server({
    cors: {
        origin: 'https://spin.bassj.io',
        methods: ['GET', 'POST'],
        credentials: true
    }
});
io.listen(http_server);
io.engine.on('connection_error', (err) => logger.error(err));

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

app.use('/room', roomRouter(csrf, io, socketSessionMiddleware));

app.get('/', csrf, (req, res) => {
    res.render('index', { csrfToken: req.csrfToken() });
});

http_server.listen(config.PORT, () => {
    logger.info('Listening on ' + config.PORT);
});
