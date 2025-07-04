const express = require('express')
const puppeteer = require('puppeteer')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

app.post('/api/scrape', async (req, res) => {
  const { location, category } = req.body
  if (!location || !category) {
    return res.status(400).json({ error: 'Missing location or category' })
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  const query = `${category} in ${location}`

  await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, {
    waitUntil: 'networkidle2',
    timeout: 0,
  })

  const leads = await page.evaluate(() => {
    const results = []
    const items = document.querySelectorAll('.Nv2PK')
    items.forEach((item) => {
      results.push({
        business_name: item.querySelector('.qBF1Pd')?.textContent || '',
        phone: item.querySelector('.UsdlK')?.textContent || '',
        website: item.querySelector('a[href^="http"]')?.href || '',
      })
    })
    return results
  })

  await browser.close()
  res.json({ leads })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Scraper running on port ${PORT}`)
})
