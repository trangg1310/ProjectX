import express from 'express'
import configViewEngine from './configs/viewEngine'
import initWebRoute from './route/web'
import session from 'express-session'
import passport from 'passport'
const initializePassport = require("./configs/passportConfig");
const flash = require('express-flash');

require('dotenv').config();

initializePassport(passport);

const app = express()
const port = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

configViewEngine(app);
initWebRoute(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
