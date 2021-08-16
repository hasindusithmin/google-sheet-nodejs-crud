
require('dotenv').config()
const { GoogleSpreadsheet } = require('google-spreadsheet')
const express = require('express')
const uuid = require('@tofandel/uuid-base62')
const { json } = require('express')

const app = express()
app.use(json())
const { PORT } = process.env;


const doc = new GoogleSpreadsheet(process.env.SHEET_ID)

app.get('/', (req, res) => { res.json({ msg: 'Hello World!' }) })

app.get('/post', async (req, res) => {
    try {
        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY
        });

        // load the documents info
        await doc.loadInfo();
        const post_sheet = doc.sheetsById[0];
        const rows = await post_sheet.getRows()
        const posts = [];
        for (row of rows) {
            const { id, date, title, body } = row;
            posts.push({ id, date, title, body })
        }
        res.status(200).json(posts)
    } catch (error) {
        res.json({ Error: error.message })
    }
})

app.get('/post/:ID', async (req, res) => {
    try {
        const { ID } = req.params;
        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY
        });

        // load the documents info
        await doc.loadInfo();
        const post_sheet = doc.sheetsById[0];
        const rows = await post_sheet.getRows()
        let post;
        for (row of rows) {
            const { id, date, title, body } = row;
            if (id == ID) post = { id, date, title, body };
            break;
        }
        res.status(200).json(post)
    } catch (error) {
        res.json({ Error: error.message })
    }
})

app.post('/post', async (req, res) => {
    try {
        const { title, body } = req.body;
        const id = uuid.v4()
        const dobj = new Date()
        const date = dobj.toString().split('G')[0]
        const row = [id, date, title, body];
        //init
        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY
        });
        // load the documents info
        await doc.loadInfo();
        const post_sheet = doc.sheetsById[0];
        await post_sheet.addRow(row)
        res.sendStatus(201)
    } catch (error) {
        res.json({ Error: error.message })
    }

})

app.put('/post/:ID', async (req, res) => {
    try {
        const { ID } = req.params;
        const { title, body } = req.body;
        //init
        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY
        });
        //load
        await doc.loadInfo()
        //choose sheet
        const posts_sheet = doc.sheetsById[0];
        const rows = await posts_sheet.getRows()
        if (title != undefined) {
            for (row of rows) {
                const { id } = row;
                if (id == ID) {
                    const { _rawProperties } = row._sheet;
                    const { index } = _rawProperties;
                    row.title = title;
                    await rows[index].save()
                    break;
                }
            }
        }
        if (body != undefined) {
            for (row of rows) {
                const { id } = row;
                if (id == ID) {
                    const { _rawProperties } = row._sheet;
                    const { index } = _rawProperties
                    row.body = body;
                    await rows[index].save()
                    break;
                }
            }
        }
        res.sendStatus(201)
    } catch (error) {
        res.json({ Error: error.message })
    }
})

app.delete('/post/:ID', async (req, res) => {
    try {
        const { ID } = req.params;
        //init
        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY
        });
        //load
        await doc.loadInfo()
        //choose sheet
        const posts_sheet = doc.sheetsById[0];
        const rows = await posts_sheet.getRows()
        for (row of rows) {
            const { id } = row;
            if (id == ID) {
                const { _rawProperties } = row._sheet;
                const { index } = _rawProperties;
                await rows[index].delete()
            }
        }
        res.sendStatus(202)
    } catch (error) {
        res.json({ Error: error.message })
    }
})


app.listen(PORT, () => {
    console.log(`http://127.0.0.1:${PORT}`);
})