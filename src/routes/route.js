const express = require('express')
const router = express.Router()
const UrlController = require('../controllers/urlController')



// Post API for url shortening.....................
router.post('/url/shorten', UrlController.urlShortner )

// GET API for redirecting to original url......
router.get('/:urlCode', UrlController.getUrl)



module.exports = router