import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        # Fetch the feed
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
            
        # Parse XML
        # Atom feed uses namespace "http://www.w3.org/2005/Atom"
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        releases = []
        
        # Each entry corresponds to a date
        for entry in root.findall('atom:entry', ns):
            date_str = entry.find('atom:title', ns).text.strip()
            updated_str = entry.find('atom:updated', ns).text.strip()
            link_elem = entry.find('atom:link[@rel="alternate"]', ns)
            link_str = link_elem.attrib.get('href', '') if link_elem is not None else ''
            
            content_elem = entry.find('atom:content', ns)
            if content_elem is None:
                continue
                
            html_content = content_elem.text
            if not html_content:
                continue
                
            # Find all h3 tags and their contents
            pattern = re.compile(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', re.DOTALL | re.IGNORECASE)
            items = pattern.findall(html_content)
            
            if not items:
                # Fallback if no h3 header is present
                text_clean = re.sub(r'<[^>]+>', '', html_content)
                text_clean = re.sub(r'\s+', ' ', text_clean).strip()
                releases.append({
                    "id": f"{date_str.replace(' ', '_').replace(',', '')}_0",
                    "date": date_str,
                    "updated": updated_str,
                    "type": "General",
                    "html": html_content.strip(),
                    "text": text_clean,
                    "tweet_text": f"BigQuery Update ({date_str}): {text_clean}",
                    "link": link_str
                })
            else:
                for index, (header, body) in enumerate(items):
                    release_type = header.strip()
                    body_clean = body.strip()
                    
                    # Create a plain text description for tweeting (removing HTML tags)
                    text_clean = re.sub(r'<[^>]+>', '', body_clean)
                    text_clean = re.sub(r'\s+', ' ', text_clean).strip()
                    
                    # Shorten text for tweeting if it's too long, but keep it readable
                    tweet_text = f"BigQuery [{release_type}] ({date_str}): {text_clean}"
                    
                    releases.append({
                        "id": f"{date_str.replace(' ', '_').replace(',', '')}_{index}",
                        "date": date_str,
                        "updated": updated_str,
                        "type": release_type,
                        "html": body_clean,
                        "text": text_clean,
                        "tweet_text": tweet_text,
                        "link": f"{link_str}#{date_str.replace(' ', '_').replace(',', '')}"
                    })
                
        return releases, None
    except Exception as e:
        return [], str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    releases, error = fetch_and_parse_feed()
    if error:
        return jsonify({"success": False, "error": error}), 500
    return jsonify({"success": True, "releases": releases})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
