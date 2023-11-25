import { name } from "ejs";
import pool from "../configs/connectDB";
import bcrypt from "bcrypt";
import moment from "moment/moment";
import multer from "multer"
import path from "path"

let getAdmin = async(req, res) => {
    const [user, fields] = await pool.execute(`select user.idUser, user.name, user.address, user.phoneNumber, account.email 
    from user, account where user.idTK = account.idTK`);
    const [danhmuc, fields1] = await pool.execute(`select idDM, nameDM from danhmuc`);
    const [product, fields2] = await pool.execute(`select sanphamchitiet.idSPCT, sanpham.idSP, sanpham.nameSP, danhmuc.nameDM, sanpham.giaBan, sanpham.imgSP, sanphamchitiet.size, sanphamchitiet.soLuong 
    from sanpham, sanphamchitiet, danhmuc where sanphamchitiet.idSP = sanpham.idSP AND sanpham.idDM = danhmuc.idDM 
    ORDER BY sanphamchitiet.idSPCT ASC`);
    const [history, fields3] = await pool.execute(`SELECT donhang.idDH, donhangchitiet.idDHCT, donhang.idUser,donhang.address, donhang.phoneNumber, donhang.timeCreate, donhang.trangThai, 
    sanpham.nameSP, sanpham.giaBan, donhangchitiet.soLuong, sanphamchitiet.size, sanphamchitiet.idSPCT 
    FROM donhang, donhangchitiet, sanpham, sanphamchitiet 
    WHERE donhang.idDH = donhangchitiet.idDHCT AND donhangchitiet.idSPCT = sanphamchitiet.idSPCT AND sanpham.idSP = sanphamchitiet.idSPCT`);
    const dthutheongay = await pool.execute('SELECT DATE(donhang.timeCreate) AS timeCreate, SUM(donhang.thanhTien) AS doanhthu FROM donhang GROUP BY DATE(donhang.timeCreate) ORDER BY DATE(donhang.timeCreate) ASC;');
    return res.render("admin.ejs", {user: user, danhmuc: danhmuc, product: product, history: history, doanhthu:dthutheongay[0]});
}

let postUpdateProduct = async(req, res) => {
    if(req.body.action =="update") {
        let {idSPCT, idSP, idDM, nameSP, size, soLuong, giaBan} = req.body;
        
    } else if(req.body.action == "delete") {
        try {
            await pool.execute('delete from sanphamchitiet where idSPCT=?', [req.body.idSPCT]);
            await pool.update('update sanpham set soluong = soluong - ?,  where idSP=?', [req.body.soLuong]);
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

} 

let postUpdateCategory = async(req, res) => {
    if(req.body.action == "update") {
        let {idDM, nameDM} = req.body;
        await pool.execute('update user set nameDM = ? where idDM = ?', [nameDM, idDM]);
        req.flash('success_msg', "Đã cập nhật danh mục thành công!");
    } else if(req.body.action == "delete") {
        try {
            await pool.execute('delete from danhmuc where idDm=?', [req.body.idDM]);
            req.flash('success_msg', "Đã xóa danh mục thành công!");
        } catch (error) {
            req.flash('error', "Có lỗi khi xóa danh mục này!");
        }
    }
    return res.redirect("/admin");
}

let createProduct = async(req, res) => {

}

let createCategory = async(req, res) => {

}

let createOrder = async(req, res) => {
    
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