// import { env } from "./config/env"
import express from "express";
export const app = express();
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(3000, () => {
    console.log(`Example function listening`);
});
