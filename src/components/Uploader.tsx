import React, { useState } from 'react'
import clsx from 'clsx'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import RandomString from 'crypto-random-string'
import Dropzone from 'react-dropzone'
import Contents from './Contents'

export default function Uploader () {
  const [contents, setContents] = useState(null)

  const handleFile = async (file, name) => {
    return new File([file], name, {
      type: file.type
    })
  }
  const handleFileDrop = async (files: Array<File>) => {
    if (files && files.length > 0) {
      const form = new FormData()
      const secret = String(new Date().getTime()) + RandomString({ length: 24 })
      const serial = CryptoJS.SHA256(secret).toString(CryptoJS.enc.Hex)
      
      await Promise.all(
        files.map(async (file, index) => {
          const attachment = await handleFile(file, index + '.md')
          form.append('attachment', attachment)
        })
      )

      const res = await axios.post('/api/upload?serial=' + serial, form)
      
      if (res.status === 200) {
        setContents(res.data)
        const clear = await axios.get('/api/clear?serial=' + serial)
        console.log(clear)
      } else {
        alert('오류가 발생했습니다.')
      }
    }
  }
  return (
    <div>
      <Dropzone onDrop={handleFileDrop}>
        {({ getRootProps, getInputProps, isDragAccept }) => (
          <div
            {...getRootProps({
              className: clsx('dropzone', isDragAccept && 'active')
            })}
          >
            <input {...getInputProps()} />
            <p>파일 드래그</p>
            <button className="add-file-button">파일추가</button>
          </div>
        )}
      </Dropzone>
      <Contents
        contents={contents}
      />
    </div>
  )
}