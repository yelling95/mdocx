import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import clsx from 'clsx'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import RandomString from 'crypto-random-string'
import Dropzone from 'react-dropzone'
import { List, Map } from 'immutable'
import { asBlob } from 'html-docx-js-typescript'
import { saveAs } from 'file-saver'

export default function Uploader() {
  const [file, setFile] = useState({ form: null, count: -1 })
  const [data, setData] = useState(List())
  const [html, setHtml] = useState(Map({ contents: '' }))
  const [lock, setLock] = useState(-1)
  const [percent, setPercent] = useState(null)
  const [spliter, setSpliter] = useState(List(['Endpoint', 'Method', '관련 화면', '구분', '담당자', '서버', '진행 상태', '프로그램 ID']))
  const [persons, setPersons] = useState(List([
    { before: 'Belle', after: '이지원' }
  ]))

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

            for (let p = 0; p < persons.size; p++) {
              let before = persons.get(p).before
              let after = persons.get(p).after
              replaced = text.replace(before, after)
            }

            const indexs = spliter.map(sp => replaced.indexOf(sp + ': ')).toJS()
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

      setHtml(html.update('contents', () => contents))
      setLock(3)
    } catch (e) {}
  }

  const handleCondition = (type: string = 's', action: string = 'a', index: number = -1) => {
    switch (action) {
      case 'a':
        if (type === 's') {
          setSpliter(spliter.push(''))
        } else {
          setPersons(persons.push({
            before: '',
            after: ''
          }))
        }
        break
      case 'r':
        if (index > -1) {
          if (type === 's') {
            setSpliter(spliter.remove(index))
          } else {
            setPersons(persons.remove(index))
          }
        }
        break
      default: 
        break
    }
  }

  const handleChange = (type: string, index: number = -1, value: string) => {
    if (type === 's') {
      setSpliter(spliter.update(index, () => value))
    } else if (type === 'pb') {
      setPersons(persons.updateIn([index, 'before'], () => value))
    } else {
      setPersons(persons.updateIn([index, 'after'], () => value))
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
      {lock === 2 && (
        <div className="flex">
          <div className="sp_wrap">
            <p>1. 구분 키워드 <button onClick={() => handleCondition('s', 'a')}>+</button></p>
            <div>
              {spliter.map((sp, s_index) => (
                <div key={`spliter-${s_index}`}>
                  <input value={sp} onChange={e => handleChange('s', s_index, e.target.value)} />
                  <button onClick={() => handleCondition('s', 'r', s_index)}>-</button>
                </div>
              ))}
            </div>
          </div>
          <div className="ps_wrap">
            <p>2. 담당자 변환 <button onClick={() => handleCondition('p', 'a')}>+</button></p>
            <div>
              {persons.map((ps, p_index) => (
                <div key={`person-${p_index}`}>
                  <input value={ps.before} onChange={e => handleChange('pb', p_index, e.target.value)}/>
                  <b>{` > `}</b>
                  <input value={ps.after} onChange={e => handleChange('pa', p_index, e.target.value)}/>
                  <button onClick={() => handleCondition('p', 'r', p_index)}>-</button>
                </div>    
              ))}      
            </div>
          </div>
        </div>
      )}
      <div className="flex" id="html-viwer">
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
      </div>
    </div>
  )
}