const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;
const FEED_URL = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml';

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.get('/api/releases', async (req, res) => {
    try {
        const response = await fetch(FEED_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch feed: ${response.statusText}`);
        }
        const xmlData = await response.text();
        
        // Parse XML using regex to avoid external parser packages
        const releases = [];
        
        // Match <entry>...</entry>
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match;
        
        while ((match = entryRegex.exec(xmlData)) !== null) {
            const entryContent = match[1];
            
            // Extract elements
            const titleMatch = entryContent.match(/<title>([\s\S]*?)<\/title>/);
            const updatedMatch = entryContent.match(/<updated>([\s\S]*?)<\/updated>/);
            
            // Extract link alternate
            const linkMatch = entryContent.match(/<link[^>]*rel="alternate"[^>]*href="([^"]*)"/);
            
            // Extract content type="html" CDATA
            const contentMatch = entryContent.match(/<content[^>]*>([\s\S]*?)<\/content>/);
            
            if (!titleMatch || !contentMatch) continue;
            
            const dateStr = titleMatch[1].trim();
            const updatedStr = updatedMatch ? updatedMatch[1].trim() : '';
            const linkStr = linkMatch ? linkMatch[1] : '';
            let htmlContent = contentMatch[1].trim();
            
            // Strip CDATA wrapper if present
            if (htmlContent.startsWith('<![CDATA[')) {
                htmlContent = htmlContent.substring(9, htmlContent.length - 3).trim();
            }
            
            // Parse HTML by <h3>...</h3>
            const h3Regex = /<h3>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3>|$)/gi;
            let h3Match;
            let index = 0;
            let itemsFound = false;
            
            while ((h3Match = h3Regex.exec(htmlContent)) !== null) {
                itemsFound = true;
                const releaseType = h3Match[1].trim();
                const bodyClean = h3Match[2].trim();
                
                // Strip HTML tags for plain text
                const textClean = bodyClean.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                const tweetText = `BigQuery [${releaseType}] (${dateStr}): ${textClean}`;
                
                releases.push({
                    id: `${dateStr.replace(/\s+/g, '_').replace(/,/g, '')}_${index}`,
                    date: dateStr,
                    updated: updatedStr,
                    type: releaseType,
                    html: bodyClean,
                    text: textClean,
                    tweet_text: tweetText,
                    link: `${linkStr}#${dateStr.replace(/\s+/g, '_').replace(/,/g, '')}`
                });
                index++;
            }
            
            if (!itemsFound) {
                // Fallback
                const textClean = htmlContent.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                releases.push({
                    id: `${dateStr.replace(/\s+/g, '_').replace(/,/g, '')}_0`,
                    date: dateStr,
                    updated: updatedStr,
                    type: 'General',
                    html: htmlContent,
                    text: textClean,
                    tweet_text: `BigQuery Update (${dateStr}): ${textClean}`,
                    link: linkStr
                });
            }
        }
        
        res.json({ success: true, releases });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
