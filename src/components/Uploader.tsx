import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import clsx from 'clsx'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import RandomString from 'crypto-random-string'
import Dropzone from 'react-dropzone'
import QuillEditor from './QuillEditor'
import { List, Map } from 'immutable'
import { asBlob } from 'html-docx-js-typescript'
import { saveAs } from 'file-saver'

export default function Uploader() {
  const [file, setFile] = useState({ form: null, count: -1 })
  const [data, setData] = useState(List())
  const [html, setHtml] = useState(Map({ contents: '' }))
  const [lock, setLock] = useState(-1)
  const [percent, setPercent] = useState(null)

  const getRenameFile = async (file: File, name: string) => {
    return new File([file], name, {
      type: file.type
    })
  }

  const getFormData = async (files: Array<File>) => {
    return await Promise.all(
      files.map(async (file, index) => {
        const form = new FormData()
        const attachment = await getRenameFile(file, index + '.md')
        form.append('attachment', attachment)
        return form
      })
    )
  }

  const handleFileDrop = async (files: Array<File>) => {
    if (files && files.length > 0) {
      const form = await getFormData(files)
      const count = files.length

      setFile({
        form,
        count
      })

      setLock(1)
    }
  }

  const handleUpload = () => {
    if (file.form) {
      const secret = String(new Date().getTime()) + RandomString({ length: 24 })
      const serial = CryptoJS.SHA256(secret).toString(CryptoJS.enc.Hex)

      const instance = axios.create({
        timeout: 60000,
        maxContentLength: 50 * 1000 * 1000
      })

      const fetch = async (seq: number, form: FormData) => {
        try {
          const response = await instance.post('/api/upload/' + serial + '?seq=' + seq, form)
          if (response.status === 200) {
            return {
              seq,
              contents: response.data
            }
          } else {
            return null
          }
        } catch (e) {
          return null
        }
      }

      let _data = List()

      Promise.all(
        file.form.map(async (form, index) => {
          const result = await fetch(index, form)
          if (result !== null) {
            const contents = result.contents
            const seq = result.seq
            _data = _data.insert(seq + 1, contents)
            setPercent(((seq + 1) / file.count) * 100)
          }
        })
      )
        .then(() => {
          instance.get('/api/clear/' + serial)
          setPercent(null)
          setData(_data)
          setLock(2)
        })
    }
  }

  const handleClear = () => {
    const viewers = document.getElementsByClassName('html-viwer')
    const spliter = ['Endpoint', 'Method', '관련 화면', '구분', '담당자', '서버', '진행 상태', '프로그램 ID']
    const persons = [
      {
        before: 'Belle',
        after: '이지원'
      }
    ]

    let contents = ''

    try {
      for (let i = 0; i < viewers.length; i++) {
        const viewer = viewers[i]
        const h1 = viewer.getElementsByTagName('h1')

        if (h1 && h1[0] && h1[0].nextSibling) {
          const _h1 = h1[0]
          if (_h1.nextSibling.nodeName.toUpperCase() === 'P' || _h1.nextSibling.nextSibling.nodeName.toUpperCase() === 'P') {
            const sibling = _h1.nextSibling.nodeName.toUpperCase() === 'P' ? _h1.nextSibling : _h1.nextSibling.nextSibling
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

          contents += String(viewer.outerHTML) + '\n'
        }
      }

      setHtml(Map({ contents }))
      setLock(3)
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
            <p>
              {file.count === -1 ? 'Drag...' : file.count + '개 파일선택됨'}
            </p>
          </div>
        )}
      </Dropzone>
      {file.count > -1 && (
        <div className="buttons">
          <button
            onClick={handleUpload}
            disabled={lock !== 1}
          >
            {percent !== null ? `${_.round(percent)}%` : `Step1`}
          </button>
          <button
            onClick={handleClear}
            disabled={lock !== 2}
          >
            Step2
          </button>
          <button
            disabled={lock !== 3}
            onClick={async () => {
              const viewer = document.getElementById('html-viwer')
              const htmlString = String(viewer.outerHTML)
              const docxBlob = await asBlob(htmlString)
              saveAs(docxBlob, 'file.docx')
            }}
          >Step3</button>
        </div>
      )}
      <div className="flex">
        <div>
          {data.map((content, index) => (
            <div
              key={`html-viwer-${index}`}
              className="html-viwer"
              dangerouslySetInnerHTML={{
                __html: content
              }}
            >
            </div>
          ))}
        </div>
        <QuillEditor
          data={html}
          onChange={value => {

          }}
        />
      </div>
    </div>
  )
}