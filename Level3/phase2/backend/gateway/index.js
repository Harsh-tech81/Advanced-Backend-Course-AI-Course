import express from 'express';
import dotenv from 'dotenv';
import proxy from 'express-http-proxy';

dotenv.config();
const PORT = process.env.PORT || 3000;
const app=express();

app.use(express.json());
app.get('/', (req, res) => {
    res.send('Hello From API-Gateway backend Service.');
});
app.use('/order', proxy('http://localhost:8002'));
app.use('/product', proxy('http://localhost:8003'));
app.use('/auth', proxy('http://localhost:8001'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});