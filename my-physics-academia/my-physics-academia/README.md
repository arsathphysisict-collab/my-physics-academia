# My Physics Academia (static prototype)
Pure HTML/CSS/JS. No build step, no API keys. Prices, testimonials, stats and admin data are demo content.
## Run locally
Open `index.html` in a browser.
## Deploy via GitHub + Vercel
1. Create a GitHub repo and push this folder's contents to it (`git init && git add . && git commit -m "init" && git remote add origin <url> && git push -u origin main`).
2. On vercel.com choose Add New > Project, import the repo.
3. Framework Preset: Other. Leave Build Command and Output Directory empty. Click Deploy.
## Tracking (NOT active)
Each page `<head>` has commented GTM and GA4 placeholders. Insert your real GTM container ID (GTM-XXXXXXX) there and add GA4 inside GTM. `js/script.js` pushes events to `window.dataLayer` using `data-track` attributes (explore_courses_click, explore_course_click, buy_now_click, enroll_now_click, contact_click, video_preview_click, course_card_click).
## To finish
Add your WhatsApp number to the link in contact.html (`https://wa.me/<countrycode><number>`), and real images to `images/`.
