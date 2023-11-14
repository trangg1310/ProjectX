import express from "express"

const configViewEngine = (app) => {
    app.use(express.static('./src/public')); // cho phep nguoi dung truy cap public
    app.set("view engine", "ejs");
    app.set("views", "./src/views");
}

export default configViewEngine;