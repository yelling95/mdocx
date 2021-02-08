import React, { useEffect, useState } from 'react'
import { Map } from 'immutable'
import clsx from 'clsx'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import RandomString from 'crypto-random-string'
import Dropzone from 'react-dropzone'
import QuillEditor from './QuillEditor'
import { asBlob } from 'html-docx-js-typescript'
import { saveAs } from 'file-saver'

export default function Uploader () {
  const [file, setFile] = useState({ form: null, count: -1 })
  const [data, setData] = useState(Map({ contents: '' }))
  const [html, setHtml] = useState(Map({ html: '' }))

  const getRenameFile = async (file: File, name: string) => {
    return new File([file], name, {
      type: file.type
    })
  }

  const getFormData = async (files: Array<File>) => {
    const form = new FormData()
    await Promise.all(
      files.map(async (file, index) => {
        const attachment = await getRenameFile(file, index + '.md')
        form.append('attachment', attachment)
      })
    )
    return form
  }

  const handleFileDrop = async (files: Array<File>) => {
    if (files && files.length > 0) {
      const form = await getFormData(files)
      const count = files.length

      setFile({
        form,
        count
      })
    }
  }

  const handleUpload = () => {
    const secret = String(new Date().getTime()) + RandomString({ length: 24 })
    const serial = CryptoJS.SHA256(secret).toString(CryptoJS.enc.Hex)
    const form = file.form

    const instance = axios.create({
      timeout: 60000,
      maxContentLength: 50 * 1000 * 1000
    })

    instance.post('/api/upload?serial=' + serial, form)
      .then(response => {
        if (response.status === 200) {
          instance.get('/api/clear?serial=' + serial)
          const contents = response.data
          setData(Map({
            contents
          }))
        } else {
          alert('오류가 발생했습니다.')
        }
      })
  }

  const handleConvert = () => {
    setHtml(Map({
      html: data.get('contents')
    }))
  }

  const handleClear = () => {
    const viewer = document.getElementById('html-viwer')
    const h1 = viewer.getElementsByTagName('h1')
    const spliter = ['Endpoint', 'Method', '관련 화면', '구분', '담당자', '서버', '진행 상태', '프로그램 ID']
    const persons = [
      {
        before: 'Belle',
        after: '이지원'
      }
    ]
    
    try {
      for (let i = 0; i < h1.length; i++) {
        if ((h1[i].nextSibling.nodeName).toUpperCase() === 'P' || (h1[i].nextSibling.nextSibling.nodeName).toUpperCase() === 'P') {
          const sibling = (h1[i].nextSibling.nodeName).toUpperCase() === 'P' ? h1[i].nextSibling : h1[i].nextSibling.nextSibling
          const text = sibling.childNodes.length > 0 ? sibling.childNodes[0].textContent : ''
          let replaced = ''

          for (let p = 0; p < persons.length; p++) {
            let before = persons[p].before
            let after = persons[p].after
            replaced = text.replace(before, after)
          }
  
          const indexs = spliter.map(sp => replaced.indexOf(sp + ': '))
          let _index = 0
          let splited = []
          
          while (_index < indexs.length) {
            splited.push(replaced.substring(indexs[_index], indexs[_index + 1]))
            _index++
          }
  
          sibling.childNodes[0].textContent = ''
  
          splited.map(sp => {
            const p = document.createElement('p')
            const t = document.createTextNode(sp)
            p.appendChild(t)
            sibling.appendChild(p)
          })
        }
      }
  
      setHtml(Map({
        html: String(viewer.outerHTML)
      }))
    } catch (e) {
      console.log(e)
    }
  }
  return (
    <div className="uploader">
      <Dropzone onDrop={handleFileDrop}>
        {({ getRootProps, getInputProps, isDragAccept }) => (
          <div
            {...getRootProps({
              className: clsx('dropzone', isDragAccept && 'active')
            })}
          >
            <input {...getInputProps()} />
            <p>Drag...</p>
          </div>
        )}
      </Dropzone>
      <button
        onClick={handleConvert}
      >
        HTML 변환하기
      </button>
      <button
        onClick={handleClear}
      >
        정리하기
      </button>
      <button
        onClick={async () => {
          const viewer = document.getElementById('html-viwer')
          const htmlString = String(viewer.outerHTML)
          const docxBlob = await asBlob(htmlString)
          saveAs(docxBlob, 'file.docx')
        }}
      >Docx로 변환하기</button>
      <div className="flex">
        <div
          id="html-viwer"
          dangerouslySetInnerHTML={{
            __html: html.get('html')
          }}
        >
        </div>
        <QuillEditor
          data={html}
          onChange={value => {
            setData(html.update('html', () => value))
          }}
        />
      </div>
    </div>
  )
}