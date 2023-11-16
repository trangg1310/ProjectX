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


let getProduct = async(req, res) => {
    return res.render("product.ejs");
}

let getUser = async(req, res) => {
    if(req.session.dalogin==true && req.session.email !== process.env.EMAIL_ADMIN) {
        let [account, fields] = await pool.query(`select * from account where email = ?`, [req.session.email]);
        let [user, fields1] = await pool.query(`select * from user where idTK = ?`, [account[0].idTK]);
        return res.render('user.ejs', {account: account[0], user: user[0], errors: errors});
    } else {
        return res.redirect('/signin');
    }
}

let postUser = async(req, res) => {
    let {name, email, address, phoneNumber} = req.body;
    errors = [];
    var phone_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
    if(phoneNumber.length != 10 || phone_regex.test(phoneNumber) == false){
        errors.push({message: "Số điện thoại không hợp lệ"});
    }
    if(errors.length>0) {
        res.redirect('/user');
    } else {
        let [account, fields] = await pool.query(`select * from account where email = ?`, [email]);
        await pool.execute(`update user set name=?, phoneNumber=?, address=? where idTK=?`, [name, phoneNumber, address, account[0].idTK]);
        req.flash('success_msg', "Thay đổi thông tin thành công");
        res.redirect("/user");
    }
}

let getChangePassword = async(req, res) => {
    return res.render("changePassword.ejs", {email: req.session.email, errors: errors});
}

let postChangePassword = async(req, res) => {
    errors = [];
    let {email, password, password1, password2} = req.body;
    if(password1 !== password2){
        errors.push({message: 'Mật khẩu xác nhận không khớp.'})
    }
    if(password.length < 6 || password1.length < 6 || password2.length < 6){
        errors.push({message: "Mật khẩu cần có ít nhất 6 ký tự."});
    }
    if(errors.length > 0){
        res.redirect('/user/changePassword');
    } else {
        let results = await pool.query (`select * from account where email = ?`, [email]);
        let account = results[0];
        let curPass = account[0].password;
        let check = bcrypt.compareSync(password, curPass);
        if(!check){
            errors.push({message: 'Mật khẩu cũ không đúng.'});
            res.redirect('/user/changePassword');
        } else {
            let hashedPassword = await bcrypt.hash(password1, 10);
            await pool.execute(`update account set password = ? where email=?`, [hashedPassword, email]);
            req.flash('success_msg', "Thay đổi mật khẩu thành công.");
            res.redirect('/user/changePassword');
        }
    }
}

let getLogout = async (req, res) => {
    req.session.destroy();
    //req.flash('success_msg', "Bạn vừa đăng xuất.");
    return res.redirect('/signin');
}
module.exports = {
    getHomePage,
    getSignIn,
    getSignUp,
    postSignUp,
    postSignIn,
    getProduct,
    getUser,
    postUser,
    getChangePassword,
    postChangePassword,
    getLogout
}