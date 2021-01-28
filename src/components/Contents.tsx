import React, { useEffect, useState } from 'react'
import QuillEditor from '../components/QuillEditor'
interface Props {
  contents: string
}

export default function Contents (props: Props) {
  const { contents } = props
  const [html, setHtml] = useState('')

  useEffect(() => {
    if (contents) {
      setHtml(contents)
    }
  }, [contents])

  return (
    <QuillEditor
      value={html}
      viewMode="editor"
      onChange={value => {
        console.log(value)
      }}
    />
  )
}