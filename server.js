const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Telebirr Transactions Store
let telebirrTransactions = [];

// Static ፋይሎችን ለማንበብ (HTML, CSS, JS)
app.use(express.static(__dirname));

// 1. Webhook Endpoint for Telebirr SMS
app.post('/webhook', (req, res) => {
    const { message, sender } = req.body;

    if (sender && sender.includes("127")) {
        const txIdMatch = message.match(/txid[:\s]*([a-z0-9]+)/i);
        const amountMatch = message.match(/etb[:\s]*([\d\.]+)/i);

        if (txIdMatch && amountMatch) {
            const txId = txIdMatch[1];
            const amount = parseFloat(amountMatch[1]);

            telebirrTransactions.push({
                txId: txId.toLowerCase(),
                amount: amount,
                date: new Date()
            });

            console.log(`[Telebirr Verified] TxID: ${txId}, Amount: ${amount} ETB`);
            return res.status(200).json({ status: "success", message: "Transaction Saved" });
        }
    }

    res.status(400).json({ status: "failed", message: "Invalid Telebirr SMS" });
});

// 2. Verify Payment API
app.post('/api/verify-payment', (req, res) => {
    const { txNumber } = req.body;

    const foundTx = telebirrTransactions.find(t => t.txId.toLowerCase() === txNumber.trim().toLowerCase());

    if (foundTx) {
        if (foundTx.amount >= 5) {
            return res.json({ success: true, message: "ክፍያው በትክክል ተረጋግጧል!" });
        } else {
            return res.json({ success: false, message: "የተከፈለው ገንዘብ ከ 5 ብር ያነሰ ነው!" });
        }
    } else {
        return res.json({ success: false, message: "ይህ የ Transaction ቁጥር አልተገኘም። እባክዎን በትክክል ከፍለው ያረጋግጡ!" });
    }
});

// 3. Home Route (Main Page)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'project.html'));
});

// Port Setting (ለ Render እንዲስማማ የተስተካከለ)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
