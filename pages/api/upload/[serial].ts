import nc from 'next-connect'
import fs from 'fs'
import multer from 'multer'
import unified from 'unified'
import markdown from 'remark-parse'
import remark2rehype from 'remark-rehype'
import html from 'rehype-stringify'
import doc from 'rehype-document'

import { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const serial = req.query.serial
      if (serial) {
        const path = 'temp/' + serial
        if (fs.existsSync(path) === false) {
          fs.mkdirSync(path, { recursive: true })
        }
        cb(null, path)
      }
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname)
    }
  })
})

const handler = nc<NextApiRequest, NextApiResponse>({
  onError(error, req, res) {
    res.status(400).json({ result: false, message: 'Sorry!' })
  },
  onNoMatch(req, res) {
    res.status(404).json({ result: false, message: 'Not Mached Method!' })
  }
})

handler.use(upload.array('attachment'))

handler.post(async (req, res) => {
  try {
    const serial = req.query.serial
    const seq = req.query.seq
    const path = 'temp/' + serial

    if (serial && seq) {
      if (fs.existsSync(path) === true) {
        let data = fs.readFileSync(path + '/' + seq + '.md')
        let text = data.toString()

        const result = unified()
          .use(markdown)
          .use(remark2rehype)
          .use(doc, { title: '' })
          .use(html)
          .processSync(text)
          .toString()

        res.status(200).end(result)
      } else {
        res.status(400).json({ result: false, message: 'Sorry!' })
      }
    } else {
      res.status(400).json({ result: false, message: 'Sorry!' })
    }
  } catch (e) {
    console.log(e)
    res.status(400).json({ result: false, message: 'Sorry!' })
  }
})

export default handler