const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ከቴሌብር የገቡ SMSዎች ማከማቻ
let telebirrTransactions = [];

// 1. ስልክህ ላይ ያለው SMS Forwarder መተግበሪያ SMS ሲልክ እዚህ ይገባል
app.post('/api/telebirr-webhook', (req, res) => {
    const { message, sender } = req.body;

    if (sender && sender.includes("telebirr")) {
        const txMatch = message.match(/transaction id[:\s]+([A-Z0-9]+)/i);
        const amountMatch = message.match(/ETB\s*([\d\.]+)/i);

        if (txMatch) {
            const txId = txMatch[1];
            const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

            telebirrTransactions.push({
                txId: txId,
                amount: amount,
                date: new Date()
            });

            console.log(`[Telebirr Verified] TxID: ${txId}, Amount: ${amount} ETB`);
            return res.status(200).json({ status: "success", message: "Transaction Saved" });
        }
    }

    res.status(400).json({ status: "failed", message: "Invalid Telebirr SMS" });
});

// 2. ዌብሳይቱ ተጠቃሚው ያስገባውን Tx No. ለማረጋገጥ የሚጠይቀው API
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
        return res.json({ success: false, message: "ይህ የ Transaction ቁጥር አልተገኘም። እባክዎን በትክክል ከፈለዉ ያረጋግጡ!" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});