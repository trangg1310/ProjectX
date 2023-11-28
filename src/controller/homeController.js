import pool from "../configs/connectDB";
import bcrypt from "bcrypt";
import moment from "moment/moment";
import multer from "multer";
import path from "path";

const user = {
  email: "",
  password: "",
  name: "",
  address: "",
  phoneNumber: "",
};

let errors = [];

const getAllCategories = async (req, res, next) => {
  try {
    const [categories, fields] = await pool.query(`SELECT * FROM danhmuc`);
    res.locals.categories = categories;
    next();
  } catch (error) {
    // Xử lý lỗi nếu có
    next(error);
  }
};

let renderNav = async (req, res) => {
  // Điều này sẽ được gọi sau khi middleware getAllCategories thực hiện xong
  return res.render("header.ejs", { categories: res.locals.categories });
};

let getHomePage = async (req, res) => {
  return res.render("index.ejs");
};

let getSignIn = async (req, res) => {
  return res.render("signin.ejs");
};
let getSignUp = async (req, res) => {
  return res.render("signup.ejs", { user: user });
};

let postSignIn = async (req, res) => {
  let { email, password } = req.body;

  let results = await pool.query(`select * from account where email = ?`, [
    email,
  ]);

  if (results[0].length <= 0) {
    req.flash("error", "Tài khoản chưa được đăng ký");
    console.log("tài khoản chưa được đăng ký");
    return res.redirect("/signin");
  }
  let account = results[0];
  let passFromDb = account[0].password;

  console.log();
  try {
    let kq = await bcrypt.compare(password, passFromDb);
    if (kq) {
      console.log("đăng nhập thành công");
      var sess = req.session;
      sess.dalogin = true;
      sess.email = email;
      sess.cart = [];
      console.log(sess.email);
      if (sess.email == process.env.EMAIL_ADMIN) {
        return res.redirect("/admin");
      }
      return res.redirect("/");
    } else {
      req.flash("error", "mật khẩu không đúng");
      console.log("mật khẩu không đúng");
      return res.redirect("/signin");
    }
  } catch (error) {
    console.log(error);
  }
};

let postSignUp = async (req, res) => {
  let { name, email, password, address, phoneNumber } = req.body;
  let errors = [];
  var phone_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;

  if (phoneNumber.length != 10 || phone_regex.test(phoneNumber) == false) {
    // user.phone = ''
    req.body.phoneNumber = "";
    errors.push({ message: "Số điện thoại không hợp lệ." });
  }

  if (password.length < 6) {
    errors.push({ message: "Mật khẩu cần có ít nhất 6 ký tự." });
  }

  if (errors.length > 0) {
    console.log(errors);
    return res.render("signup.ejs", { errors: errors, user: req.body });
  } else {
    let hashedPassword = await bcrypt.hash(password, 10);
    let resultEmail = await pool.execute(
      `select * from account where email = ?`,
      [email]
    );
    if (resultEmail[0].length > 0) {
      req.body.email = "";
      errors.push({ message: "Email này đã đăng ký với tài khoản khác." });
      if (errors.length > 0)
        res.render("signup.ejs", { errors: errors, user: req.body });
    } else {
      if (errors.length > 0)
        res.render("signup.ejs", { errors: errors, user: req.body });
      await pool.execute(
        `INSERT INTO account (email, password, admin)
            VALUES (?,?, ?)`,
        [email, hashedPassword, "0"]
      );
      let [idTK, fields] = await pool.execute(
        `select idTK from account where email=?`,
        [email]
      );
      await pool.execute(
        `INSERT INTO user (idTK, name, address, phoneNumber) VALUES(?,?,?,?)`,
        [idTK[0].idTK, name, address, phoneNumber]
      );
      req.flash("success_msg", "Đăng ký thành công. Vui lòng đăng nhập.");
      return res.redirect("signin");
    }
  }
};

let getProduct = async (req, res) => {
  const [product, fields] = await pool.query(
    `select sanpham.idSP as idSP, sanpham.nameSP as nameSP, sanpham.giaBan as giaBan, sanpham.imgSP as imgSP, sanpham.soLuong as soLuong, danhmuc.nameDM as nameDM from sanpham, danhmuc where sanpham.idDM = danhmuc.idDM`
  );
  return res.render("product.ejs", { product: product });
};

let getProductDetail = async (req, res) => {
  const productId = req.query.id;
  let [product, fields] = await pool.query(
    `select sanpham.idSP as idSP, sanpham.nameSP as nameSP, sanpham.giaBan as giaBan, sanpham.imgSP as imgSP, danhmuc.nameDM as nameDM from sanpham, danhmuc where sanpham.idDM = danhmuc.idDM and sanpham.idSP = ?`,
    [productId]
  );
  const [productDiff, fields1] = await pool.query(
    `select sanpham.idSP as idSP, sanpham.nameSP as nameSP, sanpham.giaBan as giaBan, sanpham.imgSP as imgSP, danhmuc.nameDM as nameDM from sanpham, danhmuc where sanpham.idDM = danhmuc.idDM and sanpham.idSP != ?`,
    [productId]
  );
  let [sizes, fields2] = await pool.query(
    `select size, soLuong from sanphamchitiet where idSP = ?`,
    [productId]
  );
  console.log(product);
  res.render("productDetail.ejs", {
    product: product,
    sizes: sizes,
    productDiff: productDiff,
  });
};

let getUser = async (req, res) => {
  if (
    req.session.dalogin == true &&
    req.session.email !== process.env.EMAIL_ADMIN
  ) {
    let [account, fields] = await pool.query(
      `select * from account where email = ?`,
      [req.session.email]
    );
    let [user, fields1] = await pool.query(
      `select * from user where idTK = ?`,
      [account[0].idTK]
    );
    return res.render("user.ejs", {
      account: account[0],
      user: user[0],
      errors: errors,
    });
  } else {
    return res.redirect("/signin");
  }
};

let postUser = async (req, res) => {
  let { name, email, address, phoneNumber } = req.body;
  errors = [];
  var phone_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
  if (phoneNumber.length != 10 || phone_regex.test(phoneNumber) == false) {
    errors.push({ message: "Số điện thoại không hợp lệ" });
  }
  if (errors.length > 0) {
    res.redirect("/user");
  } else {
    let [account, fields] = await pool.query(
      `select * from account where email = ?`,
      [email]
    );
    await pool.execute(
      `update user set name=?, phoneNumber=?, address=? where idTK=?`,
      [name, phoneNumber, address, account[0].idTK]
    );
    req.flash("success_msg", "Thay đổi thông tin thành công");
    res.redirect("/user");
  }
};

let getChangePassword = async (req, res) => {
  return res.render("changePassword.ejs", {
    email: req.session.email,
    errors: errors,
  });
};

let postChangePassword = async (req, res) => {
  errors = [];
  let { email, password, password1, password2 } = req.body;
  if (password1 !== password2) {
    errors.push({ message: "Mật khẩu xác nhận không khớp." });
  }
  if (password.length < 6 || password1.length < 6 || password2.length < 6) {
    errors.push({ message: "Mật khẩu cần có ít nhất 6 ký tự." });
  }
  if (errors.length > 0) {
    res.redirect("/user/changePassword");
  } else {
    let results = await pool.query(`select * from account where email = ?`, [
      email,
    ]);
    let account = results[0];
    let curPass = account[0].password;
    let check = bcrypt.compareSync(password, curPass);
    if (!check) {
      errors.push({ message: "Mật khẩu cũ không đúng." });
      res.redirect("/user/changePassword");
    } else {
      let hashedPassword = await bcrypt.hash(password1, 10);
      await pool.execute(`update account set password = ? where email=?`, [
        hashedPassword,
        email,
      ]);
      req.flash("success_msg", "Thay đổi mật khẩu thành công.");
      res.redirect("/user/changePassword");
    }
  }
};

let getLogout = async (req, res) => {
  req.session.destroy();
  //req.flash('success_msg', "Bạn vừa đăng xuất.");
  return res.redirect("/signin");
};

let getCart = async (req, res) => {
  if (
    req.session.dalogin == true &&
    req.session.email !== process.env.EMAIL_ADMIN
  ) {
    console.log(req.session.cart);
    let total = 0;
    let gross = 0;
    if (req.session.cart.length == 0) {
      total = 0;
    } else {
      for (let i = 0; i < req.session.cart.length; i++) {
        total += req.session.cart[i].giaBan * req.session.cart[i].soLuong;
        gross += Number(req.session.cart[i].soLuong);
      }
    }
    return res.render("cart.ejs", {
      product: req.session.cart,
      total: total,
      gross: gross,
    });
  } else {
    return res.redirect("/signin");
  }
};

let postCart = async (req, res) => {
  if (
    req.session.dalogin == true &&
    req.session.email !== process.env.EMAIL_ADMIN
  ) {
    let [spct, fields] = await pool.execute(
      `select idSPCT, soLuong from sanphamchitiet where idSP = ? and size = ?`,
      [req.body.idSP, req.body.size]
    );
    if (spct[0].soLuong == 0) {
      req.flash("error", "Sản phẩm đã hết hàng");
      const idValue = req.body.idSP;
      return res.redirect(`/productDetail?id=${idValue}`);
    } else if (req.body.soLuong > spct[0].soLuong) {
      req.flash("error", "Số lượng bạn muốn mua hiện không đủ trong kho!");
      const idValue = req.body.idSP;
      return res.redirect(`/productDetail?id=${idValue}`);
    } else {
      let index = req.session.cart.findIndex(
        (item) => item.idSPCT === spct[0].idSPCT
      );
      if (index == -1) {
        let x = req.session.cart.length;
        req.session.cart[x] = req.body;
        req.session.cart[x].idSPCT = spct[0].idSPCT;
      } else {
        req.session.cart[index].soLuong =
          Number(req.session.cart[index].soLuong) + Number(req.body.soLuong);
      }
      return res.redirect("/cart");
    }
  } else {
    return res.redirect("/signin");
  }
};

let postUpdateCart = async (req, res) => {
  console.log(req.body);
  if (req.body.action == "update") {
    let [soLuong, fields] = await pool.execute(
      `select soLuong from sanphamchitiet where idSP = ? and size = ?`,
      [req.body.idSP, req.body.size]
    );
    if (req.body.soLuong > soLuong[0].soLuong) {
      req.flash("error", "Số lượng bạn muốn mua hiện không đủ trong kho!");
    } else {
      let index = req.session.cart.findIndex(
        (item) => item.idSP === req.body.idSP
      );
      req.session.cart[index].soLuong = req.body.soLuong;
      req.flash("success_msg", "Cập nhật giỏ hàng thành công!");
    }
  } else if (req.body.action == "delete") {
    let removeIndex = req.session.cart.findIndex(
      (item) => item.idSP === req.body.idSP
    );
    req.session.cart.splice(removeIndex, 1);
    req.flash("success_msg", "Cập nhật giỏ hàng thành công!");
  }
  res.redirect("/cart");
};

let getPay = async (req, res) => {
  if (req.session.cart.length != 0) {
    let total = 0;
    let gross = 0;
    for (let i = 0; i < req.session.cart.length; i++) {
      total += req.session.cart[i].giaBan * req.session.cart[i].soLuong;
      gross += Number(req.session.cart[i].soLuong);
    }
    return res.render("pay.ejs", {
      product: req.session.cart,
      total: total,
      gross: gross,
    });
  }
};

let postPay = async (req, res) => {
  //console.log(req.body);
  let { nameUser, phoneNumber, address, thanhTien, soLuong, trangThai } =
    req.body;
  let curTimeString = moment(
    new Date().toLocaleString(),
    "MM/DD/YYYY HH:mm:ss a"
  ).format("YYYY-MM-DD HH:mm:ss");
  let [idUser, fields] = await pool.execute(
    `select user.idUser as idUser from user, account where user.idTK = account.idTK and account.email = ?`,
    [req.session.email]
  );
  await pool.execute(
    `insert into donhang (idUser, nameUser,address, phoneNumber, soLuong, thanhTien, timeCreate, trangThai) values (?,?,?,?,?,?,?,?)`,
    [
      idUser[0].idUser,
      nameUser,
      address,
      phoneNumber,
      soLuong,
      thanhTien,
      curTimeString,
      trangThai,
    ]
  );
  let [idDH, tmp] = await pool.execute(
    `select idDH from donhang where idUser=? and timeCreate=?`,
    [idUser[0].idUser, curTimeString]
  );
  for (let index = 0; index < req.session.cart.length; index++) {
    await pool.execute(
      `insert into donhangchitiet (idDH, idSPCT, soLuong) values (?,?,?)`,
      [
        idDH[0].idDH,
        req.session.cart[index].idSPCT,
        req.session.cart[index].soLuong,
      ]
    );
    await pool.execute(
      `update sanphamchitiet set soLuong = soLuong - ? where idSPCT =?`,
      [req.session.cart[index].soLuong, req.session.cart[index].idSPCT]
    );
    await pool.execute(
      `update sanpham set soLuong = soLuong - ? where idSP =?`,
      [req.session.cart[index].soLuong, req.session.cart[index].idSP]
    );
  }
  req.session.cart = [];
  req.flash("success_msg", "Đặt hàng thành công!");
  return res.redirect("/user/history");
};

let getHistory = async (req, res) => {
  let [idUser, fields] = await pool.execute(
    `select user.idUser as idUser from user, account where user.idTK = account.idTK and account.email = ?`,
    [req.session.email]
  );
  let [history1, fields2] = await pool.execute(
    `SELECT donhang.idDH, donhangchitiet.idDHCT, donhang.idUser,donhang.address, donhang.phoneNumber,
    donhang.timeCreate, donhang.trangThai, sanpham.nameSP, sanpham.giaBan, donhangchitiet.soLuong, sanphamchitiet.size, sanphamchitiet.idSPCT
    FROM donhang
    JOIN donhangchitiet ON donhang.idDH = donhangchitiet.idDH
    JOIN sanphamchitiet ON donhangchitiet.idSPCT = sanphamchitiet.idSPCT
    JOIN sanpham ON sanpham.idSP = sanphamchitiet.idSP
    WHERE donhang.idUser = ?`,
    [idUser[0].idUser]
  );
  return res.render("history.ejs", { history: history1 });
};

let getSearch = async (req, res) => {
  console.log(req.query);
  let sql =
    "SELECT sanpham.idSP as idSP, sanpham.nameSP as nameSP, sanpham.giaBan as giaBan, sanpham.imgSP as imgSP, sanpham.soLuong as soLuong, danhmuc.nameDM as nameDM FROM sanpham, danhmuc WHERE sanpham.idDM = danhmuc.idDM AND (nameSP LIKE '%" +
    req.query.product +
    "%' OR nameSP LIKE '" +
    req.query.product +
    "%' OR nameSP LIKE '%" +
    req.query.book +
    "%')";
  console.log(sql);
  let [product, fields] = await pool.execute(sql);
  if (product.length == 0) req.flash("error", "Không có sản phẩm bạn muốn tìm");
  return res.render("product.ejs", { product: product });
};

let getProductShirt = async (req, res) => {
  const [product, fields] = await pool.query(
    `select sanpham.idSP as idSP, sanpham.nameSP as nameSP, sanpham.giaBan as giaBan, sanpham.imgSP as imgSP, sanpham.soLuong as soLuong, danhmuc.nameDM as nameDM from sanpham, danhmuc where sanpham.idDM = danhmuc.idDM AND danhmuc.nameDM = "Shirt"`
  );
  return res.render("product.ejs", { product: product });
};

let getProductDress = async (req, res) => {
  const [product, fields] = await pool.query(
    `select sanpham.idSP as idSP, sanpham.nameSP as nameSP, sanpham.giaBan as giaBan, sanpham.imgSP as imgSP, sanpham.soLuong as soLuong, danhmuc.nameDM as nameDM from sanpham, danhmuc where sanpham.idDM = danhmuc.idDM AND danhmuc.nameDM = "Dress"`
  );
  return res.render("product.ejs", { product: product });
};

let getProductPants = async (req, res) => {
  const [product, fields] = await pool.query(
    `select sanpham.idSP as idSP, sanpham.nameSP as nameSP, sanpham.giaBan as giaBan, sanpham.imgSP as imgSP, sanpham.soLuong as soLuong, danhmuc.nameDM as nameDM from sanpham, danhmuc where sanpham.idDM = danhmuc.idDM AND danhmuc.nameDM = "Pants"`
  );
  return res.render("product.ejs", { product: product });
};

let getProductAccesscories = async (req, res) => {
  const [product, fields] = await pool.query(
    `select sanpham.idSP as idSP, sanpham.nameSP as nameSP, sanpham.giaBan as giaBan, sanpham.imgSP as imgSP, sanpham.soLuong as soLuong, danhmuc.nameDM as nameDM from sanpham, danhmuc where sanpham.idDM = danhmuc.idDM AND danhmuc.nameDM = "Accessories"`
  );
  return res.render("product.ejs", { product: product });
};

let getProductByCategory = async (req, res) => {
  const categoryName = req.params.category; // Lấy tên thể loại từ đường dẫn
  const [product, fields] = await pool.query(
    `select sanpham.idSP as idSP, sanpham.nameSP as nameSP, sanpham.giaBan as giaBan, sanpham.imgSP as imgSP, sanpham.soLuong as soLuong, danhmuc.nameDM as nameDM from sanpham, danhmuc where sanpham.idDM = danhmuc.idDM AND danhmuc.nameDM = ?`,
    [categoryName]
  );
  return res.render("productDM.ejs", {
    product: product,
    categoryName: categoryName,
  });
};

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
  getLogout,
  getCart,
  getProductDetail,
  getHistory,
  postCart,
  postUpdateCart,
  getPay,
  postPay,
  getProductShirt,
  getProductDress,
  getProductPants,
  getProductAccesscories,
  getSearch,
  getAllCategories,
  renderNav,
  getProductByCategory,
};
