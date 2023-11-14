import express from "express"
import homeController from "../controller/homeController"

let router = express.Router();

const initWebRoute = (app) => {
    router.get('/', homeController.getHomePage);
    
    router.get('/signin', homeController.getSignIn);

    router.get('/signup', homeController.getSignUp);

    router.post('/signup', homeController.postSignUp);

    return app.use('/', router);
}

module.exports = initWebRoute;