import express from 'express';
import OAuthClient from 'intuit-oauth';
import pool from "../config/db.js";

const router = express.Router();

// Initialize the QBO Client
const oauthClient = new OAuthClient({
    clientId: process.env.QBO_CLIENT_ID,
    clientSecret: process.env.QBO_CLIENT_SECRET,
    environment: 'sandbox', // Use 'sandbox' for local testing
    redirectUri: process.env.QBO_REDIRECT_URI, // http://localhost:5001/api/qbo/callback
});

router.get('/test', (req, res) => res.send('Server is alive!'));

// --- STEP 1: HANDSHAKE ---
// This route redirects the user to the Intuit Login Page
router.get('/connect', (req, res) => {
    const authUri = oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
        state: 'yess_disposal_test',
    });
    res.redirect(authUri);
});

// --- STEP 2: CALLBACK ---
// Intuit sends the user back here with a "code" in the URL
router.get('/callback', async (req, res) => {
    try {
        const authResponse = await oauthClient.createToken(req.url);
        const tokenData = authResponse.getJson();
        const realmId = oauthClient.getToken().realmId; // This is the Company ID

        // Calculate expiration date
        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

        // Save tokens to your local PG database
        await pool.query(
            `INSERT INTO qbo_tokens (realm_id, access_token, refresh_token, expires_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE 
             SET realm_id = $1, access_token = $2, refresh_token = $3, expires_at = $4`,
            [realmId, tokenData.access_token, tokenData.refresh_token, expiresAt]
        );

        res.send(`
            <html>
                <body>
                    <p>QuickBooks Connected Successfully! Closing this window...</p>
                    <script>
                        // Send a message back to the dashboard tab
                        if (window.opener) {
                            window.opener.postMessage("qbo_connected", "*");
                        }
                        // Close this popup tab
                        window.close();
                    </script>
                </body>
            </html>
        `);
    } catch (e) {
        console.error('QBO Callback Error:', e);
        res.status(500).json({ error: "Failed to connect to QuickBooks" });
    }
});

router.post('/sync-task/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;

        // 1. Get Task and Tokens from DB
        const taskResult = await pool.query('SELECT * FROM tasks WHERE task_id = $1', [taskId]);
        const tokenResult = await pool.query('SELECT * FROM qbo_tokens LIMIT 1');

        if (taskResult.rows.length === 0 || tokenResult.rows.length === 0) {
            return res.status(404).json({ error: "Task or QBO tokens not found" });
        }

        const task = taskResult.rows[0];
        const qbo = tokenResult.rows[0];

        // 2. Set the tokens in the client (so it knows who is calling)
        oauthClient.setToken(qbo);

        // 3. Construct the Invoice for Yess Trucking service
        const invoiceData = {
            Line: [{
                DetailType: "SalesItemLineDetail",
                Amount: task.invoice || 0,
                SalesItemLineDetail: {
                    ItemRef: { 
                        name: "Services", 
                        value: "1" // This "1" is the ID of the item in your QBO Sandbox
                    }
                }
            }],
            CustomerRef: { 
                value: "1" // You usually need the ID, not just the name
            }
        };

        // 4. Make the API Call
        const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${qbo.realm_id}/invoice?minorversion=73`;
        
        const response = await oauthClient.makeApiCall({
            url: url,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData),
        });

        res.json({ 
            message: "Success! Invoice created in QBO.", 
            qboResponse: response.getJson() 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// router.get('/invoices', async (req, res) => {
//     try {
//         const tokenResult = await pool.query('SELECT * FROM qbo_tokens LIMIT 1');
//         if (tokenResult.rows.length === 0) {
//             return res.status(401).json({ error: "QuickBooks not connected" });
//         }
//         const qbo = tokenResult.rows[0];

//         oauthClient.setToken(qbo);

//         const query = "SELECT * FROM Invoice ORDER BY MetaData.CreateTime DESC";
//         const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${qbo.realm_id}/query?query=${encodeURIComponent(query)}&minorversion=73`;

//         const response = await oauthClient.makeApiCall({
//             url: url,
//             method: 'GET',
//             headers: { 'Accept': 'application/json' }
//         });

//         // Use the built-in json property if available, otherwise manual parse
//         const data = response.json || JSON.parse(response.body);

//         // EXTRA SAFETY: Check if QueryResponse exists before accessing Invoice
//         if (data && data.QueryResponse && data.QueryResponse.Invoice) {
//             res.json(data.QueryResponse.Invoice);
//         } else {
//             // Return empty array if no invoices found or structure is weird
//             res.json([]);
//         }

//     } catch (err) {
//         // If the error is 'auth', you'll see it here in your terminal
//         console.error('Error fetching QBO invoices:', err.message);
//         res.status(500).json({ error: "Failed to fetch invoices. Please re-connect QBO." });
//     }
// });

router.get('/callback', async (req, res) => {
    try {
        const authResponse = await oauthClient.createToken(req.url);
        const tokenJson = authResponse.getToken();

        const realmId = req.query.realmId;
        
        // Calculate exactly when the access token will die (Current time + expires_in seconds)
        // tokenJson.expires_in is typically 3600
        const expiresAt = new Date(Date.now() + tokenJson.expires_in * 1000);

        await pool.query(
            `INSERT INTO qbo_tokens (realm_id, access_token, refresh_token, expires_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (realm_id) 
             DO UPDATE SET access_token = $2, refresh_token = $3, expires_at = $4, updated_at = NOW()`,
            [realmId, tokenJson.access_token, tokenJson.refresh_token, expiresAt]
        );

        res.redirect('http://localhost:3000/dashboard'); 
    } catch (err) {
        console.error('Callback OAuth Error:', err.message);
        res.status(500).send('Authentication failed');
    }
});

router.get('/invoices', async (req, res) => {
    try {
        const tokenResult = await pool.query('SELECT * FROM qbo_tokens ORDER BY id DESC LIMIT 1');
        if (tokenResult.rows.length === 0) {
            return res.status(401).json({ error: "QuickBooks not connected" });
        }
        
        const dbRow = tokenResult.rows[0];
        
        // 1. Map the data out for the client instance
        oauthClient.setToken({
            access_token: dbRow.access_token,
            refresh_token: dbRow.refresh_token,
            token_type: 'bearer'
        });

        // 2. Check expiration using your database timestamp directly
        // Buffer by 5 minutes (300000ms) to prevent edge-case timing errors
        const isExpired = new Date(dbRow.expires_at).getTime() - 300000 < Date.now();

        if (isExpired) {
            console.log("QBO Access Token expired based on DB timestamp. Refreshing...");
            
            const authResponse = await oauthClient.refresh();
            const newTokenJson = authResponse.getToken();

            const newExpiresAt = new Date(Date.now() + newTokenJson.expires_in * 1000);

            // 3. Update the flat columns + the new expiration date
            await pool.query(
                `UPDATE qbo_tokens 
                 SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = NOW() 
                 WHERE id = $4`,
                [newTokenJson.access_token, newTokenJson.refresh_token, newExpiresAt, dbRow.id]
            );
            
            console.log("QBO Tokens successfully refreshed and saved to DB.");
        }

        // 4. MAKE THE API CALL
        const query = "SELECT * FROM Invoice ORDER BY MetaData.CreateTime DESC";
        const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${dbRow.realm_id}/query?query=${encodeURIComponent(query)}&minorversion=73`;

        const response = await oauthClient.makeApiCall({
            url: url,
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        const data = response.json || JSON.parse(response.body);

        if (data && data.QueryResponse && data.QueryResponse.Invoice) {
            res.json(data.QueryResponse.Invoice);
        } else {
            res.json([]);
        }

    } catch (err) {
        console.error('Error fetching QBO invoices:', err.message);
        if (err.authResponse) {
            console.error('QBO Auth Response Error Details:', err.authResponse.text);
        }
        res.status(500).json({ error: "Failed to fetch invoices. Please re-connect QBO." });
    }
});

export default router;