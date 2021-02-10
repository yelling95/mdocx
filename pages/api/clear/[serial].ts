import nc from 'next-connect'
import fs from 'fs'

import { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false
  }
}

const handler = nc<NextApiRequest, NextApiResponse>({
  onError(error, req, res) {
    res.status(400).json({ result: false, message: 'Sorry!' })
  },
  onNoMatch(req, res) {
    res.status(404).json({ result: false, message: 'Not Mached Method!' })
  }
})

handler.get(async (req, res) => {
  try {
    const serial = req.query.serial
    const path = 'temp/' + serial
    if (serial) {
      if (fs.existsSync(path) === true) {
        const files = fs.readdirSync(path)
        if (files && files.length > 0) {
          await Promise.all(
            files.map(name => {
              fs.unlinkSync(path + '/' + name)
            })
          )
        }
        fs.rmdirSync(path)
      }
      res.status(200).json({ result: true })
    } else {
      res.status(400).json({ result: false, message: 'Sorry!' })
    }
  } catch (e) {
    res.status(400).json({ result: false, message: 'Sorry!' })
  }
})

export default handler