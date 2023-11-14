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

}

let postSignUp = async(req, res) => {
    console.log(bcrypt.hash(password, 10))
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