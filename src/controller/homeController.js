import pool from "../configs/connectDB";
import bcrypt from "bcrypt";
import moment from "moment/moment";

const user = {
    email: "",
    password: "",
    name: "",
    address: "",
    phoneNumber: ""
}


let errors = [];

let getHomePage = async(req, res) => {
    return res.render('index.ejs');
}

let getSignIn = async(req, res) => {
    return res.render('signin.ejs');
}
let getSignUp = async(req, res) => {
    return res.render('signup.ejs', {user: user});
}

let postSignIn = async(req, res) => {
    let {email, password} = req.body;

    let results = await pool.query (`select * from account where email = ?`, [email]);

    if(results[0].length <=0) {
        req.flash('error', "Tài khoản chưa được đăng ký");
        console.log("tài khoản chưa được đăng ký");
        return res.redirect('/signin');
    }
    let account = results[0];
    let passFromDb = account[0].password;

    console.log()
    try {
        let kq = await bcrypt.compare(password, passFromDb);
        if(kq) {
            console.log("đăng nhập thành công");
            var sess = req.session;
            sess.dalogin= true;
            sess.email=email;
            sess.giohang = [];
            console.log(sess.email);
            if(sess.email == process.env.EMAIL_ADMIN) {
                return res.redirect('/admin');
            }
            return res.redirect('/');
        } else {
            req.flash('error', "mật khẩu không đúng");
            console.log("mật khẩu không đúng")
            return res.redirect('/signin');
        }
    } catch (error) {
        console.log(error);
    }
}

let postSignUp = async(req, res) => {
    let {name, email, password, address, phoneNumber} = req.body;
    let errors = [];
    var phone_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;

    if(phoneNumber.length != 10 || phone_regex.test(phoneNumber) == false){
        // user.phone = ''
        req.body.phoneNumber = ''
        errors.push({message: "Số điện thoại không hợp lệ."});
    }

    if(password.length < 6){
        errors.push({message: "Mật khẩu cần có ít nhất 6 ký tự."});
    }

    if(errors.length > 0){
        console.log(errors);
        return res.render("signup.ejs", {errors: errors, user: req.body});
    }else{
        let hashedPassword = await bcrypt.hash(password, 10);
        let resultEmail = await pool.execute(`select * from account where email = ?`, [email]);
        if(resultEmail[0].length > 0) {
            req.body.email = '';
            errors.push({message: "Email này đã đăng ký với tài khoản khác."});
            if(errors.length > 0) res.render('signup.ejs', {errors: errors, user: req.body});
        } else {
            if(errors.length > 0) res.render('signup.ejs', {errors: errors, user: req.body});
            await pool.execute(`INSERT INTO account (email, password, admin)
            VALUES (?,?, ?)`,
            [email, hashedPassword, '0']);
            let [idTK, fields] = await pool.execute(`select idTK from account where email=?`, [email]);
            await pool.execute(`INSERT INTO user (idTK, name, address, phoneNumber) VALUES(?,?,?,?)`, [idTK[0].idTK, name, address, phoneNumber]);
            req.flash('success_msg', "Đăng ký thành công. Vui lòng đăng nhập.");
            return res.redirect('signin');
        }
    }
}

module.exports = {
    getHomePage,
    getSignIn,
    getSignUp,
    postSignUp,
    postSignIn
}