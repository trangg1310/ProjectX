import { name } from "ejs";
import pool from "../configs/connectDB";
import bcrypt from "bcrypt";
import moment from "moment/moment";
import multer from "multer"
import path from "path"

let getAdmin = async(req, res) => {
    if(req.session.dalogin==true && req.session.email == process.env.EMAIL_ADMIN) {
        const [user, fields] = await pool.execute(`select user.idUser, user.name, user.address, user.phoneNumber, account.email 
        from user, account where user.idTK = account.idTK AND account.admin = 0`);
        const [danhmuc, fields1] = await pool.execute(`select idDM, nameDM from danhmuc`);
        const [product, fields2] = await pool.execute(`select sanphamchitiet.idSPCT, sanpham.idSP, sanpham.nameSP, danhmuc.nameDM, sanpham.giaBan, sanpham.imgSP, sanphamchitiet.size, sanphamchitiet.soLuong 
        from sanpham, sanphamchitiet, danhmuc where sanphamchitiet.idSP = sanpham.idSP AND sanpham.idDM = danhmuc.idDM 
        ORDER BY sanphamchitiet.idSPCT ASC`);
        const [history, fields3] = await pool.execute(`SELECT donhang.idDH, donhangchitiet.idDHCT, donhang.idUser,donhang.address, donhang.phoneNumber, donhang.timeCreate, donhang.trangThai, 
        sanpham.nameSP, sanpham.giaBan, donhangchitiet.soLuong, sanphamchitiet.size, sanphamchitiet.idSPCT 
        FROM donhang, donhangchitiet, sanpham, sanphamchitiet 
        WHERE donhang.idDH = donhangchitiet.idDHCT AND donhangchitiet.idSPCT = sanphamchitiet.idSPCT AND sanpham.idSP = sanphamchitiet.idSPCT`);
        const dthutheongay = await pool.execute('SELECT DATE(donhang.timeCreate) AS timeCreate, SUM(donhang.thanhTien) AS doanhthu FROM donhang WHERE donhang.trangThai != "Đã hủy" GROUP BY DATE(donhang.timeCreate) ORDER BY DATE(donhang.timeCreate) ASC;');
        return res.render("admin.ejs", {user: user, danhmuc: danhmuc, product: product, history: history, doanhthu:dthutheongay[0]});
    } else {
        return res.redirect('/signin');
    }
}

let postUpdateProduct = async(req, res) => {
    if(req.body.action =="update") {
        let {idSPCT, idSP, idDM, nameSP, size, soLuong, giaBan} = req.body;
        let [slc, fields] = await pool.execute('select soLuong from sanphamchitiet where idSPCT = ?', [idSPCT]);
        await pool.execute('update sanphamchitiet set soLuong = ?, size = ? where idSPCT = ?', [soLuong,size, idSPCT]);
        await pool.execute('update sanpham set nameSP = ?, soLuong = soLuong - ? + ?, giaBan = ?, idDM = ? where idSP = ?', [nameSP, slc[0].soLuong, soLuong, giaBan, idDM, idSP]);
        req.flash('success_msg', "Đã cập nhật sản phẩm thành công!");
    } else if(req.body.action == "delete") {
        try {
            await pool.execute('delete from sanphamchitiet where idSPCT=?', [req.body.idSPCT]);
            await pool.execute('update sanpham set soluong = soluong - ? where idSP=?', [req.body.soLuong, req.body.idSP]);
            req.flash('success_msg', "Đã xóa sản phẩm thành công!");
        } catch (error) {
            req.flash('error', "Có lỗi khi xóa sản phẩm này!");
        }
    }
    return res.redirect("/admin");
}

let postUpdateUser = async(req, res) => {
    if(req.body.action == "update") {
        let {idUser, email, name, address, phoneNumber} = req.body;
        var phone_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
        if(phoneNumber.length != 10 || phone_regex.test(phoneNumber) == false) {
            req.flash('error', "Số điện thoại sai định dạng");
        } else {
            await pool.execute('update user set name = ?, address = ?, phoneNumber = ? where idUser = ?', [name, address, phoneNumber, idUser]);
            req.flash('success_msg', "Đã cập nhật thông tin người dùng thành công!");
        }
    } else if(req.body.action == "delete") {
        try {
            await pool.execute('delete from user where idUser=?', [req.body.idUser]);
            await pool.execute('delete from account where email=?', [req.body.email]);
            req.flash('success_msg', "Đã xóa người dùng thành công!");
        } catch (error) {
            req.flash('error', "Có lỗi khi xóa người dùng này!");
        }
    }
    return res.redirect("/admin");
}

let postUpdateOrder = async(req, res) => {
    if(req.body.action == "update") {
        let {idDH, idDHCT, idUser, address, phoneNumber, idSPCT, soLuong, thanhTien, timeCreate, trangThai} = req.body;
        let [slspct, fields] = await pool.execute('select soLuong from sanphamchitiet where idSPCT = ?', [idSPCT]);
        let [slc, fields1] = await pool.execute('select soLuong from donhangchitiet where idSPCT = ?', [idSPCT]);
        if(soLuong <= 0 ) {
            req.flash('error', "Số lượng sản phẩm phải lớn hơn 0!");
        } else {
            if(slspct[0].soLuong - soLuong + slc[0].soLuong >=0) {
                await pool.execute('update donhangchitiet set soLuong = ? where idDHCT = ?', [soLuong, idDHCT]);
                await pool.execute('update sanphamchitiet set soLuong = soLuong - ? + ? where idSPCT = ?', [soLuong, slc[0].soLuong ,idSPCT]);
                await pool.execute('update donhang set address = ?, phoneNumber =?, soLuong = soLuong - ? + ?, trangThai = ? where idDH = ?', [address, phoneNumber, slc[0].soLuong, soLuong, trangThai, idDH]);
                req.flash('success_msg', "Đã cập nhật đơn hàng thành công!");
            } else {
                req.flash('error', "Số lượng sản phẩm vượt quá số lượng trong kho hàng!");
            }
        }
    } else if(req.body.action == "delete") {
        req.flash('error', "Có lỗi khi xóa đơn hàng này!");
    }
    return res.redirect('/admin');
} 

let postUpdateCategory = async(req, res) => {
    if(req.body.action == "update") {
        let {idDM, nameDM} = req.body;
        await pool.execute('update danhmuc set nameDM = ? where idDM = ?', [nameDM, idDM]);
        req.flash('success_msg', "Đã cập nhật danh mục thành công!");
    } else if(req.body.action == "delete") {
        try {
            await pool.execute('delete from danhmuc where idDM=?', [req.body.idDM]);
            req.flash('success_msg', "Đã xóa danh mục thành công!");
        } catch (error) {
            req.flash('error', "Có lỗi khi xóa danh mục này!");
        }
    }
    return res.redirect("/admin");
}


let createProduct = async (req, res) => {
    // Extract form data
    let {idDM, nameSP, quantity, giaBan, imgSP} = req.body;
    for(let i = 0; i < quantity.length; i++) {
        if(quantity[i]<0) {
            req.flash('error', "Số lượng sản phẩm phải lớn hơn hoặc bằng 0!");
            return res.redirect('/admin');
        }
    }
    console.log(req.file);
    const indexOfImage = req.file.path.indexOf('image');
    const imagePath = req.file.path.substring(indexOfImage);
    let SLSP = 0;
    for(let i = 0; i< quantity.length; i++) {
        SLSP+=Number(quantity[i]);
    }
    try {
        await pool.execute('insert into sanpham(idDM, nameSP, soLuong, giaBan, imgSP) values (?,?,?,?,?)', [idDM, nameSP, SLSP, giaBan, imagePath]);
        let [idSP, fields] = await pool.execute('select idSP from sanpham where imgSP = ?', [imagePath]);
        let size = '';
        for(let i = 0; i < quantity.length; i++) {
            if(i == 0) size = 'S';
            if(i == 1) size = 'M';
            if(i == 2) size = 'L';
            if(i == 3) size = 'XL';
            await pool.execute('insert into sanphamchitiet(idSP, size, soLuong) values (?,?,?)', [idSP[0].idSP, size, quantity[i]]);
        }
        req.flash('success_msg', 'Product created successfully!');
    } catch (error) {
        req.flash('error', "Có lỗi khi tạo sản phẩm này!");
    }
    return res.redirect('/admin');
};

let createCategory = async(req, res) => {
    await pool.execute('insert into danhmuc (nameDM) values (?)', [req.body.nameDM]);
    req.flash('success_msg', "Đã thêm danh mục thành công!");
    return res.redirect("/admin");
}

let createOrder = async(req, res) => {
    let {idUser, nameUser, address, phoneNumber, idSPCT, soLuong, trangThai} = req.body;
    if(soLuong <= 0) {
        req.flash('error', "Số lượng sản phẩm phải lớn hơn 0!");
        return res.redirect('/admin');
    }
    var phone_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
    if(phoneNumber.length != 10 || phone_regex.test(phoneNumber) == false) {
        req.flash('error', "Số điện thoại không đúng định dạng!");
        return res.redirect('/admin');
    }
    try {
        let [spct, fields]= await pool.execute('select sanphamchitiet.soLuong, sanpham.idSP, sanpham.giaBan from sanpham, sanphamchitiet where sanpham.idSP = sanphamchitiet.idSP AND sanphamchitiet.idSPCT = ?', [idSPCT]);
        if (spct[0].soLuong < soLuong) {
            req.flash('error', "Số lượng sản phẩm trong kho nhỏ hơn số lượng khách muốn mua!");
            return res.redirect('/admin');
        }
        let curTimeString = moment(new Date().toLocaleString(), "MM/DD/YYYY HH:mm:ss a").format("YYYY-MM-DD HH:mm:ss");
        await pool.execute('insert into donhang (idUser, nameUser, address, phoneNumber, soLuong, thanhTien, timeCreate, trangThai) values(?,?,?,?,?,?,?,?)', [idUser, nameUser, address, phoneNumber,soLuong, soLuong*spct[0].giaBan, curTimeString, trangThai]);
        let [idDH, tmp] = await pool.execute(`select idDH from donhang where idUser=? and timeCreate=?`,
        [idUser, curTimeString]);
        await pool.execute('insert into donhangchitiet (idDH, idSPCT, soLuong) values (?,?,?)', [idDH[0].idDH, idSPCT, soLuong]);
        await pool.execute(`update sanphamchitiet set soLuong = soLuong - ? where idSPCT =?`, [soLuong, idSPCT]);
        await pool.execute(`update sanpham set soLuong = soLuong - ? where idSP =?`, [soLuong, spct[0].idSP]);
    } catch (error) {
        req.flash('error', "Có lỗi khi tạo đơn hàng này! Xem lại idUser và idSPCT");
    }
    return res.redirect("/admin");
}

module.exports = {
    getAdmin,
    postUpdateProduct,
    postUpdateUser,
    postUpdateOrder,
    postUpdateCategory,
    createProduct,
    createCategory,
    createOrder
}