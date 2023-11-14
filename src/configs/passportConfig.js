const LocalStrategy = require("passport-local").Strategy;

import pool from "./connectDB"

const bcrypt = require('bcrypt');

function initialize(passport) {
    //console.log(passport);
    const authenticateUser = (email, password, done) => {
        console.log(email)
         let results = pool.execute(
            `SELECT * FROM account WHERE email = ?`,
            [email])

                console.log(results.rows);

                if (results[0].length > 0) {
                    const account = results[0];
                    console.log(account);
                    bcrypt.compare(password, account.password, (err, isMatch) => {
                        if (err) {
                            throw err;
                        }
                        if (isMatch) {
                            return done(null, user);
                        } else {
                            return done(null, false, { message: "Mật khẩu không đúng" });
                        }
                    });
                } else {
                    return done(null, false, { message: "Tài khoản chưa được đăng ký" });
                }
            }
    //console.log(authenticateUser)

    passport.use(
        new LocalStrategy(
            {
                usernameField: "email",
                passwordField: "password"
            },
            authenticateUser
        )
    );

    passport.serializeUser((account, done) => done(null, account.idTK));

    passport.deserializeUser((id, done) => {
        let results = pool.execute(
            `SELECT * FROM account WHERE idAccount = ?`)
                return done(null, results[0]);
        
    })

}

module.exports = initialize;