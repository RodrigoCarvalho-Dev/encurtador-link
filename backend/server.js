require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const  { z } = require('zod');
const { isURL } = require('validator');

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const mongourl = `${process.env.MONGO_URL}`;

console.log("MongoDB URL:", mongourl);

if (!mongourl) {
    console.error("MongoDB connection string is not defined in .env file.");
    process.exit(1);
}



try {
    mongoose.connect(mongourl , {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 1000,
    });

    console.log("MongoDB connected successfully.");
} catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
}

const urlSchema = new mongoose.Schema({
    originalURL: {
        type: String,
        required: [true, 'URL original é obrigatória'],
        validate: {
            validator: value => isURL(value, {
                protocols: ['http', 'https'],
                require_protocol: true
            }),
            message: props => `${props.value} não é uma URL válida!`
        },
        trim: true,
        lowercase: true
    },
    shortURL: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Índice para melhor performance
urlSchema.index({ shortURL: 1 });

const Url = mongoose.model('Url', urlSchema);

// Esquema de validação com Zod
const urlSchemaZod = z.object({
    originalURL: z.string().url({ message: "URL inválida" })
});

// Encurtar URL
app.post("/api/shorten", async (req, res) => {
    try {
        // Validação com Zod
        const { originalURL } = urlSchemaZod.parse(req.body);
        
        // Verifica se a URL já existe
        const existingUrl = await Url.findOne({ originalURL });
        if (existingUrl) {
            return res.json({
                originalURL: existingUrl.originalURL,
                shortURL: existingUrl.shortURL,
                message: "URL já encurtada anteriormente"
            });
        }

        // Gera código curto único
        let shortURL;
        let isUnique = false;
        
        while (!isUnique) {
            shortURL = Math.random().toString(36).substring(2, 8);
            const exists = await Url.findOne({ shortURL });
            if (!exists) isUnique = true;
        }

        const newURL = await Url.create({ originalURL, shortURL });
        
        res.status(201).json({ 
            originalURL: newURL.originalURL, 
            shortURL: "http://localhost:5000/" + newURL.shortURL,
            createdAt: newURL.createdAt
        });
        
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: "Dados inválidos",
                details: error.errors 
            });
        }
        console.error("Erro ao encurtar URL:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// Redirecionar URL
app.get("/:shortURL", async (req, res) => {
    try {
        const { shortURL } = req.params;
        const urlData = await Url.findOneAndUpdate(
            { shortURL },
            { $inc: { clicks: 1 } }, // Contador de cliques
            { new: true }
        );
        
        if (!urlData) {
            return res.status(404).json({ error: "URL não encontrada" });
        }
        
        return res.redirect(urlData.originalURL);
    } catch (error) {
        console.error("Erro ao redirecionar:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});