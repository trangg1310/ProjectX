import express from "express"
import homeController from "../controller/homeController"

let router = express.Router();

const initWebRoute = (app) => {
    router.get('/', homeController.getHomePage);
    
    router.get('/signin', homeController.getSignIn);

    router.get('/signup', homeController.getSignUp);

    router.post('/signup', homeController.postSignUp);

    router.post('/signin', homeController.postSignIn);

    
    router.get('/product', homeController.getProduct);
    router.get('/productDetail', homeController.getProductDetail);

    router.get('/shirt', homeController.getProductShirt);
    router.get('/dress', homeController.getProductDress);
    router.get('/pants', homeController.getProductPants);
    router.get('/accesscories', homeController.getProductAccesscories);

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


    return app.use('/', router);
}

module.exports = initWebRoute;