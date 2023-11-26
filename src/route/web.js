import express from "express"
import homeController from "../controller/homeController"
import adminController from "../controller/adminController"
import multer from "multer";
import path from "path";

var appRoot = require('app-root-path');
let router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, appRoot + "/src/public/image/product");
    },
  
    // By default, multer removes file extensions so let's add them back
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
  
const imageFilter = function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
  
let upload = multer({ storage: storage, fileFilter: imageFilter });

const initWebRoute = (app) => {
    router.get('/', homeController.getHomePage);
    
    router.get('/signin', homeController.getSignIn);

    router.get('/signup', homeController.getSignUp);

    router.post('/signup', homeController.postSignUp);

    router.post('/signin', homeController.postSignIn);

    
    router.get('/product', homeController.getProduct);
    router.get('/product/:category', homeController.getProductByCategory);
    router.get('/productDetail', homeController.getProductDetail);


    router.get('/user', homeController.getUser);
    router.post('/user', homeController.postUser);

    router.get('/user/changePassword', homeController.getChangePassword);
    router.post('/user/changePassword', homeController.postChangePassword);

    router.get('/user/history', homeController.getHistory);

    router.get('/cart', homeController.getCart);
    router.post('/cart', homeController.postCart);
    router.post('/updatecart', homeController.postUpdateCart);

    router.get('/pay', homeController.getPay);
    router.post('/pay', homeController.postPay);

    router.get('/search', homeController.getSearch);

    router.get('/logout', homeController.getLogout);

    
    router.get('/admin', adminController.getAdmin);
    router.post('/adminproduct', adminController.postUpdateProduct);
    router.post('/adminuser', adminController.postUpdateUser);
    router.post('/adminorder', adminController.postUpdateOrder);
    router.post('/admincategory', adminController.postUpdateCategory);

    router.post('/admincreatecategory', adminController.createCategory);
    router.post('/admincreateproduct', upload.single('imgSP'),adminController.createProduct);
    router.post('/admincreateorder', adminController.createOrder);

    return app.use('/', router);
}

module.exports = initWebRoute;