import React, { useEffect } from 'react'

interface Props {
  contents: string
}

export default function Contents (props: Props) {
  const { contents } = props

  return (
    contents !== null ? (
      <div
        dangerouslySetInnerHTML={
          {
            __html: contents
          }
        }
      />
    ) : <div></div>
  )
}