import React, { Component, useEffect, useState } from 'react'
import { Map } from 'immutable'
import 'react-quill/dist/quill.snow.css'

const TOOLBAR_OPTIONS = [
  [{ 'font': [] }],
  [{ 'size': [] }],
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'align': [] }],
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote'],
  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
  [{ 'indent': '-1' }, { 'indent': '+1' }],
  [{ 'direction': 'rtl' }],
  [{ 'color': [] }, { 'background': [] }],
  ['link', 'image'],
  ['clean']
]

interface Props {
  data?: any,
  height?: string,
  onChange(value: string): void
}

export default function QuillEditor(props: Props) {
  const [isReady, setReady] = useState(false)

  useEffect(() => {
    if (isReady === false && document) {
      setReady(true)
    }
  })

  if (isReady === false) {
    return <></>
  }

  const Quill = require('react-quill')

  return (
    <Quill
      modules={{
        toolbar: TOOLBAR_OPTIONS
      }}
      style={{
        height: 'auto',
        minHeight: '100%'
      }}
      value={(() => {
        if (props.data === null || props.data === undefined) return ''
        return props.data.get('contents')
      })()}
      onChange={props.onChange}
    />
  )
}