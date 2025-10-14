/* Stripe Checkout + license server skeleton (dev/demo)
 * - Uses SQLite for license storage
 * - Provides /create-checkout-session (creates a Stripe session)
 * - Provides /webhook to accept Stripe events and issue licenses
 * - GET /license/:key for in-app validation
 *
 * IMPORTANT: This is a skeleton. Provide STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env for full functionality.
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const sqlite3 = require('sqlite3').verbose();
const Stripe = require('stripe');

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = STRIPE_KEY ? Stripe(STRIPE_KEY) : null;

const app = express();
const port = process.env.PORT || 4242;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const DB_PATH = path.join(__dirname, 'licenses.db');
const dbExists = fs.existsSync(DB_PATH);
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    if (!dbExists) {
        db.run(`CREATE TABLE licenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE,
            orderId TEXT,
            email TEXT,
            productId TEXT,
            createdAt TEXT,
            revoked INTEGER DEFAULT 0
        )`);
    }
});

function generateLicenseKey() {
    const rnd = () => crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
    return `PRO-${rnd()}-${rnd()}-${rnd()}-${rnd()}`;
}

function saveLicense({ key, orderId, email, productId }) {
    return new Promise((resolve, reject) => {
        const createdAt = new Date().toISOString();
        db.run(`INSERT INTO licenses (key, orderId, email, productId, createdAt) VALUES (?, ?, ?, ?, ?)`, [key, orderId, email, productId, createdAt], function (err) {
            if (err) return reject(err);
            resolve({ key, orderId, email, productId, createdAt });
        });
    });
}

function findLicense(key) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT key, orderId, email, productId, createdAt, revoked FROM licenses WHERE key = ?`, [key], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

// Create Checkout Session (skeleton) - you must provide real priceId and keys in .env
app.post('/create-checkout-session', async (req, res) => {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

    try {
        const { priceId, email } = req.body;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: email,
            success_url: `${req.protocol}://${req.get('host')}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/checkout-cancel`
        });

        res.json({ url: session.url });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Webhook endpoint for Stripe (skeleton)
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
    if (!stripe) return res.status(500).send('Stripe not configured');

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        if (STRIPE_WEBHOOK_SECRET) {
            event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
        } else {
            // If no webhook secret provided, attempt to parse body (not secure)
            event = JSON.parse(req.body.toString());
        }
    } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            (async () => {
                try {
                    const session = event.data.object;
                    // Create license and persist
                    const orderId = session.id;
                    const email = session.customer_details?.email || session.customer_email || '';
                    const productId = session.metadata?.productId || 'minimalistic_clipboard_pro';
                    const key = generateLicenseKey();
                    await saveLicense({ key, orderId, email, productId });
                    console.log('License issued for order', orderId, key);
                    // TODO: send email with license and/or render success page with deep link
                } catch (e) {
                    console.error('Error handling checkout.session.completed', e);
                }
            })();
            break;
        case 'charge.refunded':
        case 'charge.dispute.created':
            // TODO: handle revocation
            console.log('Received refund/dispute event; implement revocation logic');
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Demo: quick success page (redirect via create-checkout-session success_url will land here)
app.get('/checkout-success', async (req, res) => {
    const sessionId = req.query.session_id;
    res.send(`<!doctype html><html><body><h1>Thank you</h1><p>Session ${sessionId} received. In production this page would show the license and deep-link to the app.</p></body></html>`);
});

// Demo: simple checkout flow for local testing - creates license and redirects to success page with deep-link
app.get('/checkout-demo', async (req, res) => {
    try {
        const email = req.query.email || 'user@example.com';
        const key = generateLicenseKey();
        // Save license
        await saveLicense({ key, orderId: `demo-${Date.now()}`, email, productId: 'minimalistic_clipboard_pro' });
        // Redirect to success page with key param
        const successUrl = `/success.html?key=${encodeURIComponent(key)}`;
        res.redirect(successUrl);
    } catch (e) {
        console.error('Error in checkout-demo', e);
        res.status(500).send('demo error');
    }
});

app.get('/success.html', (req, res) => {
    const key = req.query.key || '';
    res.send(`<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Purchase Complete</title>
    <style>body{font-family: Arial, Helvetica, sans-serif;background:#f6f8fb;color:#222;padding:40px} .card{background:white;padding:24px;border-radius:12px;max-width:700px;margin:40px auto;box-shadow:0 10px 30px rgba(0,0,0,.08)} a.deep{display:inline-block;margin-top:16px;padding:12px 18px;background:#667eea;color:white;border-radius:8px;text-decoration:none}</style>
</head>
<body>
    <div class="card">
        <h1>Thanks for your purchase!</h1>
        <p>Your license key:</p>
        <pre style="background:#f2f4f8;padding:12px;border-radius:6px">${key}</pre>
        <p>Click the button to open Minimalistic Clipboard and automatically activate your license.</p>
        <a class="deep" href="minimalistic-clipboard://activate?key=${encodeURIComponent(key)}">Open in app and activate</a>
        <p style="margin-top:16px;">If the app doesn't open, copy the license key above and paste it in the app's License screen.</p>
    </div>
</body>
</html>`);
});

// License validation endpoint
app.get('/license/:key', async (req, res) => {
    const key = req.params.key;
    try {
        const rec = await findLicense(key);
        if (!rec) return res.status(404).json({ key, isPro: false });
        return res.json({ key: rec.key, isPro: true, email: rec.email, revoked: !!rec.revoked, createdAt: rec.createdAt });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'server_error' });
    }
});

app.listen(port, () => {
    console.log(`License server running on http://localhost:${port}`);
});
