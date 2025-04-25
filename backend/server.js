require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const mongourl = process.env.MONGO_URL;

if (!mongourl) {
    console.error("MongoDB connection string is not defined in .env file.");
    process.exit(1);
}

mongoose.connect(mongourl);

const urlSchema = mongoose.Schema({
    originalURL : {type: String, required: true},
    shortURL : {type: String, required: true, unique: true}
});

const url = mongoose.model('url', urlSchema);

// shorten API


// zod para validação de dados 
app.post("/api/shorten", async ( req, res ) => {

    const { originalURL } = req.body;
    const shortURL = Math.random().toString(36).substring(2, 8);
    const newURL = new url({ originalURL, shortURL });
    await newURL.save();
    res.status(201).json({ originalURL, shortURL });
    
});

app.get("/api/shorten/:shortURL", async ( req, res ) => {
    const { shortURL } = req.params;
    const urlData = await url.findOne({ shortURL });
    if (!urlData) {
        return res.status(404).json({ error: "URL not found" });
    } 
    return res.redirect(urlData.originalURL);
    
});

app.listen( PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});